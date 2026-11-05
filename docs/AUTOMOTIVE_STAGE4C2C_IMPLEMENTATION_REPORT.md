# Dynicty Automotive — Stage 4C.2C: Identity and Authorization Foundation

Verified baseline: `masbray-932/dynicty-automotive@65cbde7a1185449fda3ad8f49c512495bb8c1739` (GitHub main and Git fetch; PR #5 merge). The Stage 4C.1 audit in the earlier workspace and the 4C.2A/4C.2B reports in the merged tree were consulted. Implementation was isolated from the earlier dirty checkout.

## Baseline inventory

| Path | Classification | Verified ownership / migration risk |
|---|---|---|
| `server/auth/{actions,session}.ts`, `app/admin/login/page.tsx` | Legacy single-dealer | Global unique AdminUser email/password hash. Opaque, HMAC-hashed session token in an HttpOnly cookie, linked to one AdminUser, with expiry. No role, dealer FK, membership, platform account, or issuer. Login, logout and session persistence stay unchanged. |
| `app/admin/(protected)/layout.tsx`, dashboard, cars (list/new/edit), brands, content and settings pages | Legacy single-dealer | Page/layout guards share `requireAdmin()`; child pages also guard before sensitive reads. Cars and brand picker queries are global. Guards cannot prove ownership of a row without dealer ownership in the data model. |
| `server/settings/{actions,service}.ts` | Dealer-scoped contract, legacy single-dealer storage | Authenticated operational settings update the singleton row. Strict fields and explicit Prisma projection from 4C.2B protect branding; old logo actions deny writes. No platform mutation route. |
| `server/content/{actions,service}.ts` admin read/write | Dealer-scoped contract, legacy single-dealer storage | Profile/items relate to DealerSettings. Actions scope the profile, item lookup and counts to the singleton; item updates/deletes use IDs after the owner lookup. Owner-row lock serializes banner changes. CMS media is not the dealer logo. |
| `server/homepage/service.ts` branding read, `server/content/service.ts` public CMS, public layout/about/home | Public dealer-scoped contract, legacy single-dealer storage | Uses the server-selected singleton and active CMS items. Public logo key is resolved via storage and legacy primary is passed to the Stage 4C.2A SSR resolver. No host-to-dealer resolution or shared tenant cache key. |
| `server/cars/{actions,service}.ts`, protected car pages, `server/dashboard/service.ts` | Requires future migration | Car has global ID/slug; admin queries by ID or global filters/counts. CarImage belongs to Car, with no independent dealer FK. Upload, delete, reorder, primary selection, stats and dashboard need dealer predicates and tenant-aware ownership/constraints before onboarding a second dealer. |
| `server/master-data/actions.ts`, brands page and car brand/model pickers | Requires future migration | Brand unique name/slug globally; CarModel slug unique per Brand; Car relates to both. Define platform-shared versus dealer-owned taxonomy before adding scope. |
| `server/catalog/service.ts`, inventory methods in `server/homepage/service.ts`, `server/car-detail/service.ts`, `app/(public)/cars`, `app/sitemap.ts` | Requires future migration | Public visibility uses AVAILABLE, filters, slug and related-car queries, not dealer ownership. Catalog, metadata, related inventory and sitemap must scope consistently. |
| `services/storage/{key,index,local,r2,types}.ts`, `lib/image-delivery.ts` | Requires future migration | Vehicle keys use car ID; legacy CMS and logo paths use fixed prefixes. Provider URLs, media delivery and delete permissions need tenant-aware ownership and key namespaces before hosting independent dealers. |
| `lib/site-url.ts`, root metadata, robots, route revalidation, public data memoization | Requires future migration | One site URL/host configuration, global revalidation paths and singleton lookups. Establish verified host bindings and cache/invalidation keys before switching public reads. |
| Future branding permission; `prisma/{seed,seed-staging}.ts` offline provisioning | Platform-scoped contract only | No live platform principal, login, management route, or writer exists. Offline provisioning is not a web-admin capability and was not changed or run. |
| `app/healthz/route.ts`, fallback/error pages | Platform-level infrastructure | No dealer-scoped data selection or platform-admin grant. |

Security-critical gate: do not enable a second dealer while global inventory/taxonomy, unscoped IDs or storage/cache/host paths remain. A permission decision is not a database ownership predicate.

## Implemented boundary

- `server/auth/authorization.ts` defines distinct `PlatformAdministrator` and `DealerAdministrator` identities. `dealer:operate` requires an identified dealer actor and an exact match between its scope and the trusted target, including scope kind. `platform:dealer-branding:write` requires a platform actor and a valid explicit target scope. It is reserved for all ten canonical color tokens, the storefront logo, and any future confirmed platform-owned visual assets. It does not confer dealer operations or create a live writer.
- `allowsPermission()` denies unknown roles/permissions, missing subject IDs, and missing, invalid or mismatched scopes. It is a policy evaluator over server-verified identities, not an authentication or ownership resolver. The registered-dealer scope type has no live resolver in this stage and cannot alias the reserved legacy row.
- The existing `requireAdmin()` now delegates to the explicitly named legacy guard. It verifies the existing DB-backed session, projects only ID/email, and constructs a dealer principal with the server-owned `default` scope. Incoming headers, form fields and role hints are not sources of authority. Unauthenticated requests keep the existing login redirect; disallowed permissions fail before dealer work. No code issues a platform principal from a session.
- `server/dealer/scope.ts` provides one fixed legacy scope for the current installation. Settings and CMS retain the same database predicates; the CMS lock uses the same trusted key as its writes. Public branding and CMS select the singleton independently of admin cookies. There is no dynamic host/default fallback for a future membership or tenant resolver.
- The 4C.2B strict settings projection and read-only logo/color controls remain in force; the old logo actions still deny writes. The token contract, page/component code, inventory query behavior, session-cookie format, and storage layout are unchanged.

## Validation

| Check | Result |
|---|---|
| Vitest full suite | PASS: 282 tests across 28 files, including 4B.2, 4C.2A, and 4C.2B regressions. |
| Authorization and service boundaries | PASS: real session guard with mocked cookie/Prisma dependencies; HMAC lookup and ID/email projection, no privilege promotion from role/scope hints, unknown role/permission and missing-scope denial, cross-dealer rejection, no-session denial before Settings/CMS reads or writes, preserved settings saves, rejected branding and logo writes, fixed CMS owner/write with a forged dealer ID, public branding and active CMS reads without auth. |
| ESLint | PASS. |
| Next typegen and TypeScript no-emit | PASS. |
| Next.js production build | PASS: Next.js 16.3.5 webpack build with synthetic staging configuration and a nonresolving database address. |
| Browser and live database isolation | NOT VERIFIED. Test doubles prove application decisions and query shapes, not database row isolation. |

## Deferred dependencies

1. Add and backfill a verified dealer registry, unique domain bindings, and admin membership/grants. Replace the compatibility adapter on all relevant entry points before enabling a second dealer; never treat a failed membership lookup as the legacy dealer.
2. Establish platform identity and grant verification with a trusted issuer, explicit provisioning and revocation. Audit privileged writes and validate each trusted target before exposing any branding writer or UI.
3. Add ownership and appropriate uniqueness/relations for inventory and media; decide taxonomy ownership. Scope every admin write, public query, related record, media delivery/delete, SEO URL, sitemap, and cache key; test with two isolated dealers before activation. Decide database enforcement and verify real PostgreSQL constraints independently of these application tests.

## Changed files

- `server/auth/authorization.ts`
- `server/auth/session.ts`
- `server/dealer/scope.ts`
- `server/content/actions.ts`
- `server/content/service.ts`
- `server/homepage/service.ts`
- `server/settings/service.ts`
- `tests/dealer-authorization.test.ts`
- `docs/AUTOMOTIVE_STAGE4C2C_IMPLEMENTATION_REPORT.md`

**Verdict: PASS WITH LIMITATIONS.** This is an identity and authorization foundation for the existing single-dealer application. No live platform authority, database isolation, new schema/migration, or multi-dealer persistence was introduced. No database access, deployment or patch export was performed.
