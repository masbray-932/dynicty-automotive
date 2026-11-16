import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminEditorial, editorialImageUrl } from "@/server/editorial/service";
import { EditorialEditor } from "@/features/content/editorial-editor";
import { CmsFeedback } from "@/features/content/cms-feedback";
import Image from "next/image";
import { AdminEditorPanel } from "@/components/admin/admin-editor-panel";
import { AdminEmptyState, AdminPageHeader, AdminSection, AdminStatusBadge } from "@/components/admin/admin-ui";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requireAdmin();
  const raw = (await searchParams).page;
  const page = Math.min(1000, Math.max(1, Math.floor(Number(Array.isArray(raw) ? raw[0] : raw)) || 1));
  const { categories, services, serviceCount } = await getAdminEditorial(page);
  return <CmsFeedback><div className="mx-auto grid max-w-6xl gap-6"><AdminPageHeader eyebrow="Konten editorial" title="Layanan Showroom" description="Hanya publikasikan layanan nyata. Kategori harus aktif agar layanan terbit terlihat publik." />
    <AdminSection title={`Kategori layanan (${categories.length})`} actions={<AdminEditorPanel label="Tambah kategori" title="Kategori layanan baru"><EditorialEditor kind="category" /></AdminEditorPanel>}>
      {categories.length ? <div className="grid gap-3 sm:grid-cols-2">{categories.map(item => <article className="rounded-xl border border-white/10 bg-black/20 p-4" key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-white">{item.name}</h3><p className="mt-1 text-sm text-zinc-400">Urutan {item.sortOrder}</p><div className="mt-2"><AdminStatusBadge tone={item.active ? "success" : "neutral"}>{item.active ? "Aktif" : "Nonaktif"}</AdminStatusBadge></div></div><AdminEditorPanel label="Edit" title={`Edit kategori ${item.name}`}><EditorialEditor kind="category" initial={{ id: item.id, name: item.name, slug: item.slug, description: item.description, sortOrder: String(item.sortOrder), active: item.active }} /></AdminEditorPanel></div></article>)}</div> : <AdminEmptyState title="Belum ada kategori" description="Tambahkan kategori sebelum membuat layanan." />}
    </AdminSection>
    <AdminSection title={`Daftar layanan (${serviceCount})`} actions={<AdminEditorPanel label="Tambah layanan" title="Layanan baru"><EditorialEditor kind="service" categories={categories} /></AdminEditorPanel>}>
      {services.length ? <div className="grid gap-3">{services.map(item => { const imageUrl = editorialImageUrl(item.imageStorageKey); return <article className="grid gap-4 rounded-xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center" key={item.id}>{imageUrl ? <Image alt={item.imageAlt || item.title} className="h-20 w-24 rounded-lg object-cover" height={80} src={imageUrl} unoptimized width={96} /> : <div className="grid h-20 w-24 place-items-center rounded-lg bg-white/5 text-xs text-zinc-500">Tanpa gambar</div>}<div><h3 className="font-bold text-white">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm text-zinc-400">{item.shortDescription}</p><div className="mt-2 flex flex-wrap gap-2"><AdminStatusBadge tone={item.status === "PUBLISHED" ? "success" : "neutral"}>{item.status === "PUBLISHED" ? "Terbit" : "Draft"}</AdminStatusBadge>{item.homepageVisible ? <AdminStatusBadge tone="warning">Homepage</AdminStatusBadge> : null}<span className="text-xs text-zinc-500">Urutan {item.sortOrder}</span></div></div><AdminEditorPanel label="Edit" title={`Edit layanan ${item.title}`}><EditorialEditor kind="service" categories={categories} imageUrl={imageUrl} initial={{ id: item.id, title: item.title, slug: item.slug, categoryId: item.categoryId, shortDescription: item.shortDescription, body: item.body, imageAlt: item.imageAlt, hasImage: Boolean(item.imageStorageKey), status: item.status, homepageVisible: item.homepageVisible, sortOrder: String(item.sortOrder) }} /></AdminEditorPanel></article>; })}</div> : <AdminEmptyState title="Belum ada layanan" description="Tambahkan layanan pertama setelah kategori tersedia." />}
      <nav aria-label="Halaman layanan" className="mt-5 flex gap-3 text-sm font-semibold">{page > 1 ? <Link className="rounded-lg border border-white/15 px-4 py-2" href={`/admin/services?page=${page - 1}`}>Sebelumnya</Link> : null}{page * 20 < serviceCount ? <Link className="rounded-lg border border-white/15 px-4 py-2" href={`/admin/services?page=${page + 1}`}>Berikutnya</Link> : null}</nav>
    </AdminSection>
  </div></CmsFeedback>;
}
