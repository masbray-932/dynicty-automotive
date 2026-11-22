import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getPublicEditorialDetail } from "@/server/editorial/public";
import { metadataDescription, publicMetadata } from "@/server/editorial/metadata";
import { EditorialDetail } from "@/features/editorial/public-content";
import { ServiceCtaBanner } from "@/features/editorial/service-cta-banner";
import { buildBreadcrumbStructuredData, buildServiceStructuredData, serializeJsonLd } from "@/features/seo/structured-data";
import { getDealerPresentation } from "@/server/homepage/service";
import { getStorefrontSiteUrl, legacyStorefrontContext } from "@/server/storefront/context";
type Props = { params: Promise<{slug:string}> };
export async function generateMetadata({params}:Props) {
  await connection();
  const {slug}=await params;
  const item=await getPublicEditorialDetail("service",slug);
  if(!item)return {title:"Konten tidak ditemukan",robots:{index:false,follow:false}};
  return publicMetadata(item.title,item.summary,`/services/${item.slug}`,{image:item.imageUrl?{url:item.imageUrl,alt:item.imageAlt}:null});
}
export default async function Page({params}:Props) {
  await connection();
  const {slug}=await params;
  const item=await getPublicEditorialDetail("service",slug);
  if(!item)notFound();
  const dealer=await getDealerPresentation();
  const siteUrl=getStorefrontSiteUrl(legacyStorefrontContext);
  const url=new URL(`/services/${item.slug}`,siteUrl).toString();
  const service=buildServiceStructuredData({title:item.title,description:metadataDescription(item.summary),url,imageUrl:item.imageUrl,dealerName:dealer.dealerName,dealerUrl:siteUrl,updatedAt:item.updatedAt});
  const breadcrumb=buildBreadcrumbStructuredData([{name:"Beranda",url:new URL("/",siteUrl).toString()},{name:"Layanan",url:new URL("/services",siteUrl).toString()},{name:item.title,url}]);
  return <><script dangerouslySetInnerHTML={{__html:serializeJsonLd(service)}} type="application/ld+json"/><script dangerouslySetInnerHTML={{__html:serializeJsonLd(breadcrumb)}} type="application/ld+json"/><EditorialDetail item={item} base="/services" />{item.cta?<ServiceCtaBanner cta={item.cta}/>:null}</>;
}
