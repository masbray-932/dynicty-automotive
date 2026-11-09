import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminEditorial, editorialImageUrl } from "@/server/editorial/service";
import { EditorialEditor } from "@/features/content/editorial-editor";
import { CmsFeedback } from "@/features/content/cms-feedback";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requireAdmin();
  const raw = (await searchParams).page;
  const page = Math.min(1000, Math.max(1, Math.floor(Number(Array.isArray(raw) ? raw[0] : raw)) || 1));
  const { categories, services, serviceCount } = await getAdminEditorial(page);
  return <CmsFeedback><div className="grid min-w-0 gap-6"><h1 className="text-3xl font-bold">Layanan Showroom</h1><p className="text-zinc-300">Hanya publikasikan layanan nyata. Kategori harus aktif agar layanan terbit terlihat publik.</p><h2 className="text-2xl">Kategori layanan</h2><EditorialEditor kind="category" />{categories.map(item => <details key={item.id}><summary className="min-h-11 cursor-pointer">{item.name} — {item.active ? "Aktif" : "Nonaktif"}</summary><EditorialEditor kind="category" initial={{ id: item.id, name: item.name, slug: item.slug, description: item.description, sortOrder: String(item.sortOrder), active: item.active }} /></details>)}<h2 className="text-2xl">Daftar layanan ({serviceCount})</h2><EditorialEditor kind="service" categories={categories} />{services.map(item => <details key={item.id}><summary className="min-h-11 cursor-pointer">{item.title} — {item.status === "PUBLISHED" ? "Terbit" : "Draft"}</summary><EditorialEditor kind="service" categories={categories} imageUrl={editorialImageUrl(item.imageStorageKey)} initial={{ id: item.id, title: item.title, slug: item.slug, categoryId: item.categoryId, shortDescription: item.shortDescription, body: item.body, imageAlt: item.imageAlt, hasImage: Boolean(item.imageStorageKey), status: item.status, homepageVisible: item.homepageVisible, sortOrder: String(item.sortOrder) }} /></details>)}<nav aria-label="Halaman layanan" className="flex gap-5">{page > 1 ? <Link href={`/admin/services?page=${page - 1}`}>Sebelumnya</Link> : null}{page * 20 < serviceCount ? <Link href={`/admin/services?page=${page + 1}`}>Berikutnya</Link> : null}</nav></div></CmsFeedback>;
}
