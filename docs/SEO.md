# SEO

## Indexing rules

| Route | Indexing | Canonical |
| --- | --- | --- |
| `/` | index, follow | `/` |
| `/cars` without query | index, follow | `/cars` |
| `/cars` with any query, including malformed/unknown values | noindex, follow | `/cars` |
| `/cars/[slug]` for AVAILABLE inventory | indexable | exact detail URL |
| Unknown, DRAFT, or SOLD detail | noindex via metadata/404 | none |
| `/admin` and descendants | noindex, nofollow plus response header | none |

Homepage title and description use the factual DealerSettings name with a safe fallback. Catalog metadata avoids creating indexable filter/search/sort/page duplicates. Detail metadata is sourced only through the AVAILABLE-only query; canonical, Open Graph URL, primary ordered image, and placeholder fallback stay consistent.

## Structured data

AVAILABLE detail pages emit a compact `Vehicle` object with factual vehicle fields and an `Offer` using the stored IDR price and current public URL. No ratings, reviews, financing, warranty, certification, or invented address components are emitted. JSON is escaped against script termination. Organization/LocalBusiness markup is deferred because a free-form address cannot reliably provide required components.

## Sitemap and robots

The sitemap contains Homepage, `/cars`, and at most 5,000 AVAILABLE detail URLs. Vehicle `updatedAt` supplies reliable `lastModified`; DRAFT, SOLD, admin, and filters cannot enter the query. It executes at request time and degrades to the two static public URLs on a database failure without returning a stack trace.

Robots allows public navigation, disallows `/admin` paths, and advertises the centralized absolute sitemap URL. Filter pages remain crawlable for navigation but declare `noindex,follow` in metadata.

## Site URL

`lib/site-url.ts` trims trailing slashes and is the single source for metadata base, sitemap, robots, detail URLs, and contextual WhatsApp links. Development falls back to `http://localhost:3000`; production validation requires an explicit absolute HTTPS value.
