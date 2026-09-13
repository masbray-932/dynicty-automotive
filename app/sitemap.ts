import type { MetadataRoute } from "next";
import { getAvailableCarSitemapEntries } from "@/server/car-detail/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const cars = await getAvailableCarSitemapEntries();
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/cars`, changeFrequency: "daily", priority: 0.9 },
    ...cars.map((car) => ({ url: `${baseUrl}/cars/${car.slug}`, lastModified: car.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
