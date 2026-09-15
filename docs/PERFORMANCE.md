# Performance

## Rendering boundaries

Homepage, catalog, detail, dashboard, settings, and authenticated admin remain Server Components. Client JavaScript is restricted to interactive forms, dependent search controls, galleries, delete confirmation, mobile navigation, and error recovery. Database-backed public routes and sitemap intentionally render on request; robots and the generic not-found page remain static.

## Queries and pagination

Public queries select only presentation fields. Card queries take one ordered image. Homepage lists are bounded, detail recommendations run three bounded queries concurrently, dashboard metrics run concurrently, catalog uses a fixed page size of 12, and user page input is capped at 1,000. Sitemap is capped at 5,000 rows. The Phase 6 migration adds `(status, updatedAt)` for recent AVAILABLE inventory and sitemap ordering. No obvious N+1 query remains.

## Images and fonts

Cards and galleries reserve 4:3 aspect ratios and provide responsive `sizes`; thumbnails use fixed sizes and only the true hero/detail lead image is priority. Local uploads can use Next Image optimization. External R2 URLs remain unoptimized until a specific production media hostname can be configured—no wildcard host is allowed in Next Image. Upload limits reduce oversized-object risk without recompression or silent quality loss. Geist fonts use `next/font`, avoiding render-blocking third-party font requests.

## Cache and revalidation

React request caching deduplicates dealer/detail reads within a render. The application intentionally avoids permanent data caching before production topology is known. Mutations revalidate only affected admin/public routes, detail paths, and sitemap. Admin responses are private/no-store. This favors correctness for a single dealer inventory while preserving a clean point for explicit production cache tags later.

## Known limitations

R2 delivery/CDN and remote image optimization require the final production hostname. Offset pagination becomes less efficient at very large inventories; the 1,000-page guard bounds abuse and cursor pagination can be considered only if real inventory volume justifies it. Browser performance and layout-shift measurements remain Phase 7 work.
