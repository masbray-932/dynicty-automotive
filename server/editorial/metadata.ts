import "server-only";
import type { Metadata } from "next";
import { getDealerPresentation } from "@/server/homepage/service";
import { legacyStorefrontContext, getStorefrontSiteUrl } from "@/server/storefront/context";

type PublicMetadataOptions = {
  fullTitle?: string;
  filtered?: boolean;
  image?: { url: string; alt: string } | null;
  type?: "website" | "article";
  publishedAt?: Date | null;
  updatedAt?: Date | null;
};

export function metadataDescription(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 160);
}

export async function publicMetadata(title: string, descriptionInput: string, path: string, options: PublicMetadataOptions = {}): Promise<Metadata> {
  const dealer = await getDealerPresentation();
  const canonical = new URL(path, getStorefrontSiteUrl(legacyStorefrontContext)).toString();
  const description = metadataDescription(descriptionInput);
  const fullTitle = options.fullTitle ?? `${title} — ${dealer.dealerName}`;
  const images = options.image ? [{ url: options.image.url, alt: options.image.alt }] : undefined;
  const openGraph: Metadata["openGraph"] = options.type === "article"
    ? {
        type: "article", title: fullTitle, description, url: canonical, siteName: dealer.dealerName,
        locale: "id_ID", ...(images ? { images } : {}),
        ...(options.publishedAt ? { publishedTime: options.publishedAt.toISOString() } : {}),
        ...(options.updatedAt ? { modifiedTime: options.updatedAt.toISOString() } : {}),
      }
    : { type: "website", title: fullTitle, description, url: canonical, siteName: dealer.dealerName, locale: "id_ID", ...(images ? { images } : {}) };
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical },
    robots: options.filtered
      ? { index: false, follow: true }
      : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph,
    twitter: { card: images ? "summary_large_image" : "summary", title: fullTitle, description, ...(images ? { images } : {}) },
  };
}
