# Architecture

## Shape

The project is one full-stack Next.js App Router application. Route groups separate the public shell from protected admin routes without changing URLs. React Server Components are the default. Client Components are limited to interactive boundaries such as the login form, Homepage dependent brand/model search, and error recovery.

## Responsibilities

- `app/`: routing, metadata, loading/error boundaries, and route composition.
- `components/`: small reusable public, admin, and UI components.
- `features/`: feature-facing interactive UI.
- `server/`: server-only configuration and authentication code.
- `services/`: infrastructure boundaries, currently object storage.
- `db/client.ts`: the only Prisma client construction point.
- `validation/`: reusable schemas independent of UI.
- `prisma/`: database model, committed migrations, and seed.
- `tests/`: high-value foundation behavior.

## Request boundaries

The Homepage uses dynamic server rendering and reads only presentation-safe fields through `server/homepage/service.ts`. The `/admin/login` page accepts credentials through a Server Action. Protected admin layouts call `requireAdmin()` server-side before rendering. Every mutation repeats authorization and input validation inside its Server Action; hiding a button is not an authorization boundary.

Business rules should live in feature/server services, not JSX. Infrastructure providers must be reached through interfaces so later R2 adoption does not rewrite car-domain behavior.

## Phase 1 write flow

Client forms invoke dedicated `use server` action modules. Each action re-authorizes the admin and validates untrusted `FormData` before calling `server/cars/service.ts`. The service owns brand/model consistency, Decimal conversion, unique-slug allocation, transactions for cover/order changes, and storage compensation. Pure price, slug, relationship, image-order, and upload rules remain independently testable.

## Phase 2 public read flow

`app/(public)/page.tsx` composes server-provided Homepage data. The service enforces `status = AVAILABLE` for inventory queries, separately requires `featured = true` for featured cars, selects only card fields, resolves media through `StorageProvider`, and converts Prisma Decimal values to strings before crossing the component boundary. Query failures degrade sections to professional empty states. Dealer fallbacks and URL/search presentation rules live in `features/homepage/domain.ts`; only the dependent brand/model selector requires client JavaScript.

## Phase 3 catalog read flow

`features/catalog/domain.ts` parses untrusted URL values, maps sorting/pagination, validates option dependencies, and builds navigation URLs. `features/catalog/query.ts` constructs the Prisma predicate and unconditionally includes `status = AVAILABLE`. `server/catalog/service.ts` fetches public-aware filter options, validates database relationships, counts results, applies server pagination, selects one ordered image per car, and converts Decimal prices before presentation. `/cars` is server-rendered from URL state and reuses the Phase 2 `VehicleCard`; filters require no client-side fetching.

## Phase 4 detail read flow

`server/car-detail/service.ts` validates a public slug, fetches an exact `status = AVAILABLE` car with selected relations/images, resolves media through `StorageProvider`, converts Decimal values, reads public DealerSettings, and queries three bounded related-vehicle tiers. React request caching shares the service result between metadata and page rendering. `features/car-detail/domain.ts` owns title, visibility, image ordering, SEO text, and encoded WhatsApp rules. Only the thumbnail gallery is a Client Component. The sitemap uses the same server boundary to include AVAILABLE slugs and degrades to static entries if PostgreSQL is unavailable.

## Phase 5 administration flow

Protected settings UI calls authenticated Server Actions, validates with Zod, and upserts fixed `DealerSettings.id = "default"`. Logo storage uses `dealer/logo/` keys with compensation and best-effort old-object cleanup. Targeted revalidation refreshes public consumers. Public layout maps validated colors to CSS variables. The dashboard service runs counts, grouping, and recent reads in parallel and returns an explicit error variant instead of invented zeroes.
