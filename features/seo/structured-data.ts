import type { DealerPresentation } from "@/features/homepage/domain";

type BreadcrumbItem = { name: string; url: string };
type EditorialSeoInput = {
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  dealerName: string;
  dealerUrl: string;
  publishedAt?: Date | null;
  updatedAt: Date;
};

function optionalUrl(value: string | null | undefined, baseUrl: string) {
  if (!value) return null;
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function dealerSchemaId(siteUrl: string) {
  return `${new URL(siteUrl).origin}/#organization`;
}

export function buildDealerStructuredData(dealer: DealerPresentation, siteUrl: string) {
  const url = new URL("/", siteUrl).toString();
  const logo = optionalUrl(dealer.logoUrl, url);
  const sameAs = [dealer.instagramUrl, dealer.facebookUrl]
    .map((value) => optionalUrl(value, url))
    .filter((value): value is string => Boolean(value));

  return {
    "@context": "https://schema.org",
    "@type": ["AutoDealer", "LocalBusiness"],
    "@id": dealerSchemaId(url),
    name: dealer.dealerName,
    url,
    ...(logo ? { logo, image: logo } : {}),
    ...(dealer.phone ? { telephone: dealer.phone } : {}),
    ...(dealer.email ? { email: dealer.email } : {}),
    ...(dealer.address ? { address: dealer.address } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function buildBreadcrumbStructuredData(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildArticleStructuredData(input: EditorialSeoInput) {
  const image = optionalUrl(input.imageUrl, input.url);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${input.url}#article`,
    headline: input.title,
    description: input.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    ...(image ? { image: [image] } : {}),
    ...(input.publishedAt ? { datePublished: input.publishedAt.toISOString() } : {}),
    dateModified: input.updatedAt.toISOString(),
    author: { "@id": dealerSchemaId(input.dealerUrl) },
    publisher: { "@id": dealerSchemaId(input.dealerUrl), name: input.dealerName },
  };
}

export function buildServiceStructuredData(input: EditorialSeoInput) {
  const image = optionalUrl(input.imageUrl, input.url);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${input.url}#service`,
    name: input.title,
    description: input.description,
    url: input.url,
    ...(image ? { image } : {}),
    provider: { "@id": dealerSchemaId(input.dealerUrl), name: input.dealerName },
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
