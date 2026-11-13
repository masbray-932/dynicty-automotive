import Link from "next/link";
import { buildCatalogUrl, pageNumbers, type CatalogFilters } from "./domain";
import type { CatalogBrandOption } from "@/server/catalog/service";
import { formatRupiah } from "@/lib/format";

type Options = { brands: CatalogBrandOption[]; transmissions: string[] };

export function CatalogFilterForm({ filters, brands, transmissions }: { filters: CatalogFilters } & Options) {
  const models = brands.find((brand) => brand.slug === filters.brand)?.models ?? [];
  return (
    <form action="/cars" className="grid gap-5" method="get">
      <label className="grid gap-2 text-sm font-semibold text-[#171717]">Kata kunci<input className="public-control px-3 font-normal placeholder:text-[#8E8E93]" defaultValue={filters.q} name="q" placeholder="Merek, model, varian, tahun" type="search" /></label>
      <label className="grid gap-2 text-sm font-semibold text-[#171717]">Kondisi<select className="public-control px-3 font-normal" defaultValue={filters.condition ?? ""} name="condition"><option value="">Semua kondisi</option><option value="NEW">Mobil baru</option><option value="USED">Mobil bekas</option></select></label>
      <label className="grid gap-2 text-sm font-semibold text-[#171717]">Merek<select className="public-control px-3 font-normal" defaultValue={filters.brand ?? ""} name="brand"><option value="">Semua merek</option>{brands.map((brand) => <option key={brand.slug} value={brand.slug}>{brand.name}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-semibold text-[#171717]">Model<select className="public-control px-3 font-normal disabled:bg-[#F6F6F6] disabled:text-[#8E8E93]" defaultValue={filters.model ?? ""} disabled={!filters.brand || models.length === 0} name="model"><option value="">Semua model</option>{models.map((model) => <option key={model.slug} value={model.slug}>{model.name}</option>)}</select><span className="text-xs font-normal text-[#606060]">Pilih merek lalu terapkan filter untuk menampilkan model.</span></label>
      <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-semibold text-[#171717]">Harga</legend><div className="grid grid-cols-2 gap-2"><input aria-label="Harga minimum" className="public-control min-w-0 px-3 placeholder:text-[#8E8E93]" defaultValue={filters.minPrice} inputMode="numeric" name="minPrice" placeholder="Minimum" /><input aria-label="Harga maksimum" className="public-control min-w-0 px-3 placeholder:text-[#8E8E93]" defaultValue={filters.maxPrice} inputMode="numeric" name="maxPrice" placeholder="Maksimum" /></div></fieldset>
      <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-semibold text-[#171717]">Tahun</legend><div className="grid grid-cols-2 gap-2"><input aria-label="Tahun minimum" className="public-control min-w-0 px-3 placeholder:text-[#8E8E93]" defaultValue={filters.minYear} inputMode="numeric" name="minYear" placeholder="Minimum" /><input aria-label="Tahun maksimum" className="public-control min-w-0 px-3 placeholder:text-[#8E8E93]" defaultValue={filters.maxYear} inputMode="numeric" name="maxYear" placeholder="Maksimum" /></div></fieldset>
      <label className="grid gap-2 text-sm font-semibold text-[#171717]">Transmisi<select className="public-control px-3 font-normal" defaultValue={filters.transmission ?? ""} name="transmission"><option value="">Semua transmisi</option>{transmissions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <input name="sort" type="hidden" value={filters.sort} />
      <button className="min-h-12 rounded bg-brand-primary px-5 text-xs font-extrabold uppercase tracking-wider text-brand-on-primary hover:brightness-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus" type="submit">Terapkan Filter</button>
      <Link className="text-center text-sm font-semibold text-[#606060] hover:text-[#171717]" href="/cars">Reset Filter</Link>
    </form>
  );
}

function hiddenFilterInputs(filters: CatalogFilters) {
  return (["condition", "brand", "model", "q", "minPrice", "maxPrice", "minYear", "maxYear", "transmission"] as const).map((key) => filters[key] !== undefined ? <input key={key} name={key} type="hidden" value={filters[key]} /> : null);
}

export function SortControl({ filters }: { filters: CatalogFilters }) {
  return <form action="/cars" className="flex items-center gap-2" method="get">{hiddenFilterInputs(filters)}<label className="sr-only" htmlFor="catalog-sort">Urutkan mobil</label><select className="public-control px-3 text-sm" defaultValue={filters.sort} id="catalog-sort" name="sort"><option value="newest">Terbaru</option><option value="price-asc">Harga terendah</option><option value="price-desc">Harga tertinggi</option><option value="year-desc">Tahun terbaru</option><option value="year-asc">Tahun terlama</option></select><button className="min-h-11 rounded border border-[#171717] px-4 text-sm font-semibold text-[#171717] hover:bg-[#171717] hover:text-white" type="submit">Urutkan</button></form>;
}

export function ActiveFilters({ filters, brands }: { filters: CatalogFilters; brands: CatalogBrandOption[] }) {
  const brand = brands.find((item) => item.slug === filters.brand);
  const model = brand?.models.find((item) => item.slug === filters.model);
  const chips: Array<{ label: string; href: string }> = [];
  if (filters.condition) chips.push({ label: filters.condition === "NEW" ? "Baru" : "Bekas", href: buildCatalogUrl(filters, { condition: null }) });
  if (filters.brand) chips.push({ label: brand?.name ?? filters.brand, href: buildCatalogUrl(filters, { brand: null, model: null }) });
  if (filters.model) chips.push({ label: model?.name ?? filters.model, href: buildCatalogUrl(filters, { model: null }) });
  if (filters.q) chips.push({ label: `“${filters.q}”`, href: buildCatalogUrl(filters, { q: null }) });
  if (filters.minPrice || filters.maxPrice) chips.push({ label: `${filters.minPrice ? formatRupiah(filters.minPrice) : "Rp 0"} – ${filters.maxPrice ? formatRupiah(filters.maxPrice) : "tanpa batas"}`, href: buildCatalogUrl(filters, { minPrice: null, maxPrice: null }) });
  if (filters.minYear || filters.maxYear) chips.push({ label: `${filters.minYear ?? "Awal"}–${filters.maxYear ?? "Sekarang"}`, href: buildCatalogUrl(filters, { minYear: null, maxYear: null }) });
  if (filters.transmission) chips.push({ label: filters.transmission, href: buildCatalogUrl(filters, { transmission: null }) });
  if (!chips.length) return null;
  return <div aria-label="Filter aktif" className="flex flex-wrap items-center gap-2">{chips.map((chip) => <Link className="inline-flex min-h-9 items-center rounded border border-[#F1B8C2] bg-[#FDF2F4] px-3 text-sm text-[#A60D26] hover:bg-[#F8E4E8]" href={chip.href} key={`${chip.label}-${chip.href}`}>{chip.label}<span aria-hidden="true" className="ml-2">×</span></Link>)}<Link className="ml-1 text-sm font-semibold text-[#606060] underline hover:text-[#171717]" href="/cars">Reset semua</Link></div>;
}

export function CatalogPagination({ filters, totalPages }: { filters: CatalogFilters; totalPages: number }) {
  if (totalPages <= 1) return null;
  const pages = pageNumbers(filters.page, totalPages);
  return <nav aria-label="Paginasi katalog" className="mt-10 flex flex-wrap items-center justify-center gap-2">{filters.page > 1 ? <Link className="inline-flex min-h-11 items-center rounded border border-[#E5E5E5] px-4 text-sm font-semibold text-[#171717] hover:border-[#171717]" href={buildCatalogUrl(filters, { page: filters.page - 1 }, false)}>Sebelumnya</Link> : null}{pages.map((page, index) => <span className="contents" key={page}>{index > 0 && page - pages[index - 1] > 1 ? <span aria-hidden="true" className="px-1 text-[#8E8E93]">…</span> : null}<Link aria-current={page === filters.page ? "page" : undefined} className={`grid min-h-11 min-w-11 place-items-center rounded border text-sm font-bold ${page === filters.page ? "border-[#C8102E] bg-[#C8102E] text-white" : "border-[#E5E5E5] text-[#606060] hover:border-[#171717]"}`} href={buildCatalogUrl(filters, { page }, false)}>{page}</Link></span>)}{filters.page < totalPages ? <Link className="inline-flex min-h-11 items-center rounded border border-[#E5E5E5] px-4 text-sm font-semibold text-[#171717] hover:border-[#171717]" href={buildCatalogUrl(filters, { page: filters.page + 1 }, false)}>Berikutnya</Link> : null}</nav>;
}
