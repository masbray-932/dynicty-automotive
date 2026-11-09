import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getAdminEditorial, editorialImageUrl } from "@/server/editorial/service";
import { EditorialEditor } from "@/features/content/editorial-editor";
import { CmsFeedback } from "@/features/content/cms-feedback";

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requireAdmin();
  const raw = (await searchParams).page;
  const page = Math.min(1000, Math.max(1, Math.floor(Number(Array.isArray(raw) ? raw[0] : raw)) || 1));
  const { articles, articleCount } = await getAdminEditorial(page);
  return <CmsFeedback><div className="grid min-w-0 gap-6"><h1 className="text-3xl font-bold">Artikel ({articleCount})</h1><p className="text-zinc-300">Tulis konten asli sebagai teks biasa. Draft tidak tersedia melalui pembaca konten publik.</p><EditorialEditor kind="article" />{articles.map(item => <details key={item.id}><summary className="min-h-11 cursor-pointer">{item.title} — {item.status === "PUBLISHED" ? "Terbit" : "Draft"}</summary><EditorialEditor kind="article" imageUrl={editorialImageUrl(item.imageStorageKey)} initial={{ id: item.id, title: item.title, slug: item.slug, excerpt: item.excerpt, body: item.body, imageAlt: item.imageAlt, hasImage: Boolean(item.imageStorageKey), status: item.status }} /></details>)}<nav aria-label="Halaman artikel" className="flex gap-5">{page > 1 ? <Link href={`/admin/articles?page=${page - 1}`}>Sebelumnya</Link> : null}{page * 20 < articleCount ? <Link href={`/admin/articles?page=${page + 1}`}>Berikutnya</Link> : null}</nav></div></CmsFeedback>;
}
