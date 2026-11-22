import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminEditorial, editorialImageUrl } from "@/server/editorial/service";
import { EditorialEditor } from "@/features/content/editorial-editor";
import { CmsFeedback } from "@/features/content/cms-feedback";
import Image from "next/image";
import { AdminEditorPanel } from "@/components/admin/admin-editor-panel";
import { AdminEmptyState, AdminPageHeader, AdminSection, AdminStatusBadge } from "@/components/admin/admin-ui";

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requireAdmin();
  const raw = (await searchParams).page;
  const page = Math.min(1000, Math.max(1, Math.floor(Number(Array.isArray(raw) ? raw[0] : raw)) || 1));
  const { articles, articleCount } = await getAdminEditorial(page);
  return <CmsFeedback><div className="mx-auto grid max-w-6xl gap-6"><AdminPageHeader eyebrow="Konten editorial" title={`Artikel (${articleCount})`} description="Tulis konten asli sebagai teks biasa. Draft tidak tersedia melalui pembaca konten publik." actions={<AdminEditorPanel label="Tambah artikel" title="Artikel baru"><EditorialEditor kind="article" /></AdminEditorPanel>} />
    <AdminSection title="Daftar artikel" description="Form edit dibuka hanya untuk artikel yang dipilih.">{articles.length ? <div className="grid gap-3">{articles.map(item => { const imageUrl = editorialImageUrl(item.imageStorageKey); return <article className="grid gap-4 rounded-xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center" key={item.id}>{imageUrl ? <Image alt={item.imageAlt || item.title} className="h-20 w-24 rounded-lg object-cover" height={80} src={imageUrl} unoptimized width={96} /> : <div className="grid h-20 w-24 place-items-center rounded-lg bg-white/5 text-xs text-zinc-500">Tanpa gambar</div>}<div><h3 className="font-bold text-white">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm text-zinc-400">{item.excerpt}</p><div className="mt-2"><AdminStatusBadge tone={item.status === "PUBLISHED" ? "success" : "neutral"}>{item.status === "PUBLISHED" ? "Terbit" : "Draft"}</AdminStatusBadge></div></div><AdminEditorPanel label="Edit" title={`Edit artikel ${item.title}`}><EditorialEditor kind="article" imageUrl={imageUrl} initial={{ id: item.id, title: item.title, slug: item.slug, excerpt: item.excerpt, body: item.body, imageAlt: item.imageAlt, hasImage: Boolean(item.imageStorageKey), status: item.status }} /></AdminEditorPanel></article>; })}</div> : <AdminEmptyState title="Belum ada artikel" description="Gunakan tombol Tambah artikel untuk membuat konten pertama." />}
      <nav aria-label="Halaman artikel" className="mt-5 flex gap-3 text-sm font-semibold">{page > 1 ? <Link className="rounded-lg border border-white/15 px-4 py-2" href={`/admin/articles?page=${page - 1}`}>Sebelumnya</Link> : null}{page * 20 < articleCount ? <Link className="rounded-lg border border-white/15 px-4 py-2" href={`/admin/articles?page=${page + 1}`}>Berikutnya</Link> : null}</nav>
    </AdminSection>
  </div></CmsFeedback>;
}
