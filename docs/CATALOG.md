# Public Car Catalog

## Route and visibility

`/cars` is the single catalog route for all, new, and used vehicles. Every Prisma catalog predicate contains `status = AVAILABLE`; DRAFT and SOLD data is also excluded from filter-option queries. There are no duplicate condition routes.

## Filters and URL state

The catalog accepts `condition`, `brand`, `model`, `q`, `minPrice`, `maxPrice`, `minYear`, `maxYear`, `transmission`, `sort`, and `page` as documented in `HOMEPAGE_SEARCH_CONTRACT.md`. Reloading, sharing, and browser navigation reproduce the server-rendered state. Applying a filter or sort omits `page`, returning to page one. Pagination links preserve all active filters.

Brand/model slugs and transmission values come only from AVAILABLE inventory. The model control stays disabled until a brand is applied, keeping the client payload small and preventing irrelevant model lists. Price comparison uses Prisma Decimal values, not formatted strings. Year limits use the runtime year plus one. Keyword search covers brand name, model name, variant, and an exact four-digit year.

## Sorting and pagination

Supported sorting is newest (default), price ascending/descending, and year ascending/descending. Every order includes ascending ID as a deterministic tie-breaker. Pagination is server-side with 12 records per page and a matching database count. An out-of-range non-empty page renders a recovery state linking to the last valid page rather than redirecting unexpectedly.

## Invalid and empty states

Malformed scalar parameters are ignored with visible notices. Reversed price/year ranges are removed. Unknown brands, models without a brand, brand/model mismatches, and unknown transmissions return a clean zero-result explanation without querying a contradictory combination. Database failures expose no Prisma details. Empty results offer a reset action and never insert fake inventory.

## Images and cards

The catalog reuses `VehicleCard`. Each record selects only one image after ordering primary first, then `sortOrder`, then creation time. URLs resolve through `StorageProvider`; otherwise the Phase 2 local placeholder is used.

## SEO

The unfiltered `/cars` page is indexable with canonical `/cars`. All filtered, sorted, searched, and paginated combinations retain canonical `/cars` and use `noindex,follow`. Dedicated SEO landing pages are deferred, preventing uncontrolled indexing of parameter combinations.
