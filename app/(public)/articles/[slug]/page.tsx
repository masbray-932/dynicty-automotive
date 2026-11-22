import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getPublicEditorialDetail } from "@/server/editorial/public";
import { metadataDescription, publicMetadata } from "@/server/editorial/metadata";
import { EditorialDetail } from "@/features/editorial/public-content";
import { buildArticleStructuredData, buildBreadcrumbStructuredData, serializeJsonLd } from "@/features/seo/structured-data";
import { getDealerPresentation } from "@/server/homepage/service";
import { getStorefrontSiteUrl, legacyStorefrontContext } from "@/server/storefront/context";
type Props = { params: Promise<{slug:string}> };
export async function generateMetadata({params}:Props) {
  await connection();
  const {slug}=await params;
  const item=await getPublicEditorialDetail("article",slug);
  if(!item)return {title:"Konten tidak ditemukan",robots:{index:false,follow:false}};
  return publicMetadata(item.title,item.summary,`/articles/${item.slug}`,{
    type:"article", image:item.imageUrl?{url:item.imageUrl,alt:item.imageAlt}:null,
    publishedAt:item.publishedAt, updatedAt:item.updatedAt,
  });
}
export default async function Page({params}:Props) {
  await connection();
  const {slug}=await params;
  const item=await getPublicEditorialDetail("article",slug);
  if(!item)notFound();
  const dealer=await getDealerPresentation();
  const siteUrl=getStorefrontSiteUrl(legacyStorefrontContext);
  const url=new URL(`/articles/${item.slug}`,siteUrl).toString();
  const article=buildArticleStructuredData({title:item.title,description:metadataDescription(item.summary),url,imageUrl:item.imageUrl,dealerName:dealer.dealerName,dealerUrl:siteUrl,publishedAt:item.publishedAt,updatedAt:item.updatedAt});
  const breadcrumb=buildBreadcrumbStructuredData([{name:"Beranda",url:new URL("/",siteUrl).toString()},{name:"Artikel",url:new URL("/articles",siteUrl).toString()},{name:item.title,url}]);
  return <><script dangerouslySetInnerHTML={{__html:serializeJsonLd(article)}} type="application/ld+json"/><script dangerouslySetInnerHTML={{__html:serializeJsonLd(breadcrumb)}} type="application/ld+json"/><EditorialDetail item={item} base="/articles" /></>;
}
