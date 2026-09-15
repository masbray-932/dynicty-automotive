import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { isStagingDeployment } from "@/lib/deployment-environment";

export default function robots(): MetadataRoute.Robots {
  if (isStagingDeployment()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  const baseUrl = getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/admin/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
