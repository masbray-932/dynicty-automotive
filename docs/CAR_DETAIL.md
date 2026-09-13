# Public Car Detail

## Route and visibility

`/cars/[slug]` uses the URL-safe car slug only. The server query combines exact slug matching with `status = AVAILABLE`. Unknown, malformed, DRAFT, and SOLD slugs all use the same Next.js not-found behavior and reveal no hidden record existence. Database failures show a generic retry state without exposing Prisma details.

## Data and presentation

The detail service selects identity, condition, price, specifications, description, update timestamp, brand/model, and ordered image metadata. Decimal price becomes a string before presentation. The title is built from brand, model, variant, and year. NEW cars omit mileage; USED cars show positive mileage with the shared Indonesian formatter. Plain-text descriptions render newlines without accepting HTML.

## Gallery

Images are ordered primary first, then `sortOrder`, creation time, and ID. The small client gallery supports thumbnail selection plus previous/next controls with stable 4:3 layout. Single-image and no-image records remain stable; the latter uses `/images/car-placeholder.svg`. URLs always resolve through `StorageProvider`.

## Related vehicles

Three bounded AVAILABLE-only queries prefer the same model, then same brand, then other vehicles. The current record is excluded and each tier is deterministically ordered. Up to three cards reuse `VehicleCard`.

## SEO and sitemap

Each AVAILABLE car gets factual title, description, canonical, Open Graph fields/image, and conservative `Vehicle` JSON-LD with an in-stock IDR offer. No ratings, warranty, financing, inspection, or expiry claims are invented. The sitemap includes only AVAILABLE detail slugs; database failure safely leaves the static Homepage/catalog entries.
