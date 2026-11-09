import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getPublicEditorialDetail } from "@/server/editorial/public";
import { publicMetadata } from "@/server/editorial/metadata";
import { EditorialDetail } from "@/features/editorial/public-content";
type Props = { params: Promise<{slug:string}> };
export async function generateMetadata({params}:Props) { await connection();const {slug}=await params;const item=await getPublicEditorialDetail("article",slug);if(!item)return {title:"Konten tidak ditemukan",robots:{index:false,follow:false}};return {...await publicMetadata(item.title,item.summary.slice(0,160),`/articles/${item.slug}`),...(item.imageUrl?{openGraph:{title:item.title,description:item.summary.slice(0,160),url:`/articles/${item.slug}`,images:[{url:item.imageUrl,alt:item.imageAlt}]}}:{})}; }
export default async function Page({params}:Props) {await connection();const {slug}=await params;const item=await getPublicEditorialDetail("article",slug);if(!item)notFound();return <EditorialDetail item={item} base="/articles" />;}
