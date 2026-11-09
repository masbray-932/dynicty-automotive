import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getStorefrontSiteUrl, legacyStorefrontContext } from "@/server/storefront/context";
import { getAvailableCarSitemapEntries } from "@/server/car-detail/service";

import { getEditorialSitemapEntries } from "@/server/editorial/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const baseUrl = getStorefrontSiteUrl(legacyStorefrontContext);
  const [cars, editorial] = await Promise.all([getAvailableCarSitemapEntries(legacyStorefrontContext), getEditorialSitemapEntries()]);
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/cars`, changeFrequency: "daily", priority: 0.9 },
    ...["services","sell-car","articles","contact"].map(path=>({url:`${baseUrl}/${path}`,changeFrequency:"monthly" as const,priority:0.6})),
    ...editorial.map(item=>({url:`${baseUrl}${item.path}`,lastModified:item.updatedAt,changeFrequency:"weekly" as const,priority:0.7})),
    ...cars.map((car) => ({ url: `${baseUrl}/cars/${car.slug}`, lastModified: car.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
