import { connection } from "next/server";
import { PageContainer } from "@/components/ui/page-container";
import { EditorialCards, EditorialPagination } from "@/features/editorial/public-content";
import { getPublicEditorialList, publicPage } from "@/server/editorial/public";
import { publicMetadata } from "@/server/editorial/metadata";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({searchParams}: Props) { await connection(); const params=await searchParams; return publicMetadata("Artikel", "Informasi artikel yang diterbitkan showroom.", "/articles", Object.keys(params).length > 0); }
export default async function Page({searchParams}: Props) {
 await connection(); const params=await searchParams; const page=publicPage(params.page); const category = undefined;
 const data=await getPublicEditorialList("article",page,category);
 return <PageContainer className="py-12"><h1 className="text-4xl font-bold">Artikel</h1>{data.items.length ? <EditorialCards items={data.items} base="/articles" /> : <p role="status" className="mt-6 text-zinc-300">Belum ada konten terbit untuk pilihan ini.</p>}<EditorialPagination base="/articles" page={page} count={data.count} category={category} /></PageContainer>;
}
