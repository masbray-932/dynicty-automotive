import { connection } from "next/server";
import { PageContainer } from "@/components/ui/page-container";
import { EditorialCards, EditorialPagination } from "@/features/editorial/public-content";
import { getPublicEditorialList, publicPage } from "@/server/editorial/public";
import { publicMetadata } from "@/server/editorial/metadata";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({searchParams}: Props) { await connection(); const params=await searchParams; return publicMetadata("Layanan Showroom", "Informasi layanan showroom yang diterbitkan showroom.", "/services", Object.keys(params).length > 0); }
export default async function Page({searchParams}: Props) {
 await connection(); const params=await searchParams; const page=publicPage(params.page); const rawCategory = params.category; const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
 const data=await getPublicEditorialList("service",page,category);
 return <PageContainer className="py-12"><h1 className="text-4xl font-bold">Layanan Showroom</h1><form action="/services" method="get" className="mt-6 flex flex-wrap items-end gap-3"><label className="grid gap-2">Kategori layanan<select name="category" defaultValue={category ?? ""} className="min-h-11 max-w-full rounded-lg border border-white/20 bg-zinc-950 p-3"><option value="">Semua kategori</option>{data.categories.map(item=><option key={item.id} value={item.slug}>{item.name}</option>)}</select></label><button className="min-h-11 rounded-lg bg-brand-primary px-5 font-bold text-brand-on-primary focus-visible:outline-2 focus-visible:outline-brand-focus">Terapkan</button></form>{data.items.length ? <EditorialCards items={data.items} base="/services" /> : <p role="status" className="mt-6 text-zinc-300">Belum ada konten terbit untuk pilihan ini.</p>}<EditorialPagination base="/services" page={page} count={data.count} category={category} /></PageContainer>;
}
