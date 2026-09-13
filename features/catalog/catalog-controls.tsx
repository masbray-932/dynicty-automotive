import Link from "next/link";
import { buildCatalogUrl, pageNumbers, type CatalogFilters } from "./domain";
import type { CatalogBrandOption } from "@/server/catalog/service";
import { formatRupiah } from "@/lib/format";

type Options = { brands: CatalogBrandOption[]; transmissions: string[] };

export function CatalogFilterForm({ filters, brands, transmissions }: { filters: CatalogFilters } & Options) {
  const models = brands.find((brand) => brand.slug === filters.brand)?.models ?? [];
  return (
    <form action="/cars" className="grid gap-5" method="get">
      <label className="grid gap-2 text-sm font-semibold text-zinc-200">Kata kunci<input className="min-h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 font-normal text-white outline-none placeholder:text-zinc-600 focus:border-red-500" defaultValue={filters.q} name="q" placeholder="Merek, model, varian, tahun" type="search" /></label>
      <label className="grid gap-2 text-sm font-semibold text-zinc-200">Kondisi<select className="min-h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 font-normal text-white outline-none focus:border-red-500" defaultValue={filters.condition ?? ""} name="condition"><option value="">Semua kondisi</option><option value="NEW">Mobil baru</option><option value="USED">Mobil bekas</option></select></label>
      <label className="grid gap-2 text-sm font-semibold text-zinc-200">Merek<select className="min-h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 font-normal text-white outline-none focus:border-red-500" defaultValue={filters.brand ?? ""} name="brand"><option value="">Semua merek</option>{brands.map((brand) => <option key={brand.slug} value={brand.slug}>{brand.name}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-semibold text-zinc-200">Model<select className="min-h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 font-normal text-white outline-none focus:border-red-500 disabled:text-zinc-600" defaultValue={filters.model ?? ""} disabled={!filters.brand || models.length === 0} name="model"><option value="">Semua model</option>{models.map((model) => <option key={model.slug} value={model.slug}>{model.name}</option>)}</select><span className="text-xs font-normal text-zinc-500">Pilih merek lalu terapkan filter untuk menampilkan model.</span></label>
      <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-semibold text-zinc-200">Harga</legend><div className="grid grid-cols-2 gap-2"><input aria-label="Harga minimum" className="min-h-11 min-w-0 rounded-xl border border-white/10 bg-zinc-950 px-3 text-white outline-none placeholder:text-zinc-600 focus:border-red-500" defaultValue={filters.minPrice} inputMode="numeric" name="minPrice" placeholder="Minimum" /><input aria-label="Harga maksimum" className="min-h-11 min-w-0 rounded-xl border border-white/10 bg-zinc-950 px-3 text-white outline-none placeholder:text-zinc-600 focus:border-red-500" defaultValue={filters.maxPrice} inputMode="numeric" name="maxPrice" placeholder="Maksimum" /></div></fieldset>
      <fieldset className="grid gap-2"><legend className="mb-2 text-sm font-semibold text-zinc-200">Tahun</legend><div className="grid grid-cols-2 gap-2"><input aria-label="Tahun minimum" className="min-h-11 min-w-0 rounded-xl border border-white/10 bg-zinc-950 px-3 text-white outline-none placeholder:text-zinc-600 focus:border-red-500" defaultValue={filters.minYear} inputMode="numeric" name="minYear" placeholder="Minimum" /><input aria-label="Tahun maksimum" className="min-h-11 min-w-0 rounded-xl border border-white/10 bg-zinc-950 px-3 text-white outline-none placeholder:text-zinc-600 focus:border-red-500" defaultValue={filters.maxYear} inputMode="numeric" name="maxYear" placeholder="Maksimum" /></div></fieldset>
      <label className="grid gap-2 text-sm font-semibold text-zinc-200">Transmisi<select className="min-h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 font-normal text-white outline-none focus:border-red-500" defaultValue={filters.transmission ?? ""} name="transmission"><option value="">Semua transmisi</option>{transmissions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <input name="sort" type="hidden" value={filters.sort} />
      <button className="min-h-12 rounded-xl bg-red-600 px-5 font-bold text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500" type="submit">Terapkan Filter</button>
      <Link className="text-center text-sm font-semibold text-zinc-400 hover:text-white" href="/cars">Reset Filter</Link>
    </form>
  );
}

function hiddenFilterInputs(filters: CatalogFilters) {
  return (["condition", "brand", "model", "q", "minPrice", "maxPrice", "minYear", "maxYear", "transmission"] as const).map((key) => filters[key] !== undefined ? <input key={key} name={key} type="hidden" value={filters[key]} /> : null);
}

export function SortControl({ filters }: { filters: CatalogFilters }) {
  return <form action="/cars" className="flex items-center gap-2" method="get">{hiddenFilterInputs(filters)}<label className="sr-only" htmlFor="catalog-sort">Urutkan mobil</label><select className="min-h-11 rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-red-500" defaultValue={filters.sort} id="catalog-sort" name="sort"><option value="newest">Terbaru</option><option value="price-asc">Harga terendah</option><option value="price-desc">Harga tertinggi</option><option value="year-desc">Tahun terbaru</option><option value="year-asc">Tahun terlama</option></select><button className="min-h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/10" type="submit">Urutkan</button></form>;
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
  return <div aria-label="Filter aktif" className="flex flex-wrap items-center gap-2">{chips.map((chip) => <Link className="inline-flex min-h-9 items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 text-sm text-red-200 hover:bg-red-500/20" href={chip.href} key={`${chip.label}-${chip.href}`}>{chip.label}<span aria-hidden="true" className="ml-2">×</span></Link>)}<Link className="ml-1 text-sm font-semibold text-zinc-400 underline hover:text-white" href="/cars">Reset semua</Link></div>;
}

export function CatalogPagination({ filters, totalPages }: { filters: CatalogFilters; totalPages: number }) {
  if (totalPages <= 1) return null;
  const pages = pageNumbers(filters.page, totalPages);
  return <nav aria-label="Paginasi katalog" className="mt-10 flex flex-wrap items-center justify-center gap-2">{filters.page > 1 ? <Link className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/10" href={buildCatalogUrl(filters, { page: filters.page - 1 }, false)}>Sebelumnya</Link> : null}{pages.map((page, index) => <span className="contents" key={page}>{index > 0 && page - pages[index - 1] > 1 ? <span aria-hidden="true" className="px-1 text-zinc-600">…</span> : null}<Link aria-current={page === filters.page ? "page" : undefined} className={`grid min-h-11 min-w-11 place-items-center rounded-xl border text-sm font-bold ${page === filters.page ? "border-red-500 bg-red-600 text-white" : "border-white/15 text-zinc-300 hover:bg-white/10"}`} href={buildCatalogUrl(filters, { page }, false)}>{page}</Link></span>)}{filters.page < totalPages ? <Link className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/10" href={buildCatalogUrl(filters, { page: filters.page + 1 }, false)}>Berikutnya</Link> : null}</nav>;
}
