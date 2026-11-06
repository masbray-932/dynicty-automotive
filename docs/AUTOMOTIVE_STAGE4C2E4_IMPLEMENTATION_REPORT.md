# Dynicty Automotive — Stage 4C.2E.4: Dealer-scoped data access

**Verdict: PASS WITH LIMITATIONS.** The server-only DAL is an internal foundation. It does not activate registered-dealer storefronts, registered-dealer administration, or full data isolation.

## Baseline and evidence

Verified GitHub `masbray-932/dynicty-automotive` `main` and local fetched HEAD at `7ed005464e476bc2e4d09bdd06c85d0544ad2e7a` (merge of PR #10). Reviewed the Stage 4C.2D architecture audit, 4C.2E.1/E.2/E.3 reports, Prisma schema and migrations, dealer hostname resolution and scope, session and authorization code, inventory and taxonomy CRUD, public queries, storage boundaries, tests and deployment docs. Work took place on a separate worktree; the pre-existing dirty checkout was preserved.

## Security boundaries

| Area | Implemented behavior |
|---|---|
| Trusted scope | An opaque capability is issued and validated inside a server-only module. A copied object, missing scope or caller-provided dealer ID cannot become a capability. The registered capability comes only from the existing domain resolver, which rejects invalid, unknown, unverified, suspended or ambiguous bindings. Failure never falls back to legacy. |
| Domain and authorization | A hostname selects public inventory only. No route or header parser calls the new DAL. Future routing must establish ingress trust. Registered reads recheck the active Dealer, matched binding ID/version, active verification state and active canonical binding in the query. Canonical uniqueness relies on the existing SQL invariant and the resolver checks cardinality when issuing the capability. |
| Reads | Lists and counts, vehicle ID/slug detail, brand lists/detail, models and image metadata use exact ownership predicates. Legacy uses explicit `dealerId: null`; registered reads exclude NULL and other dealers. Vehicle and taxonomy visibility requires same-owner AVAILABLE inventory. Image reads qualify the vehicle and return metadata only, without object keys or URLs. Paged reads are bounded and stable; list/count share a repeatable-read transaction. |
| Registered writes | Every operation rejects a registered read capability before authorization or Prisma execution. The existing session system cannot establish a registered-dealer membership; no platform or dealer privilege is inferred from a host or scope. |
| Internal legacy writes | The dormant CRUD contract authenticates with existing `requireAdmin()` at execution. Writes use explicit NULL-owner predicates or server-selected NULL ownership. Vehicle assignment verifies a same-owner brand/model pair inside a serializable transaction; model rename cannot reparent. FK restrictions remain in place, ordinary CRUD cannot reassign owners, and serialization errors propagate without automatic retry. Zero-row scoped updates/deletes do not probe other owners. |
| Media writes | Associate/remove contracts reject execution before Prisma writes. Scoped deletion of a car with image rows is also denied. An asset ownership model and coordinated storage cleanup are needed; a raw storage key does not prove ownership. Existing legacy image workflows are unchanged. |
| Schema | No schema or migration change, backfill or constraint removal. Reuses the existing Brand → CarModel → Car → CarImage composite ownership FKs. PostgreSQL `MATCH SIMPLE` still permits a NULL-owner child to reference an owned parent. This expansion schema cannot replace scoped predicates or a verified cutover. |

## Legacy access still requiring migration

| Consumer | Current access to migrate before activating registered inventory |
|---|---|
| Public homepage and catalog — `server/homepage/service.ts`, `server/catalog/service.ts` | Global featured/latest rows, brands/models, filter options and pagination/count. Bind every query and cache key to trusted scope. |
| Public detail and sitemap — `server/car-detail/service.ts`, `app/sitemap.ts` | Global slug lookup, related cars, gallery and AVAILABLE sitemap entries. Scope detail, SEO URLs, media projection and cache invalidation to the same resolved dealer. |
| Admin dashboard and vehicles — `server/dashboard/service.ts`, `app/admin/(protected)/cars/` | Global totals, recent rows, list/detail by ID, edit/create taxonomy options. Authenticate dealer membership and scope all predicates before moving these screens. |
| Taxonomy — `app/admin/(protected)/brands/page.tsx`, `server/master-data/actions.ts` | Global brand/model reads, slug probes and mutation selectors. Qualify ownership for the target and relation changes. |
| Vehicle mutations/media — `server/cars/actions.ts`, `server/cars/service.ts`, `services/storage/` | Global vehicle/model/slug lookups; image attach, cover, reorder, deletion and cleanup use legacy IDs/object keys. Verify parent and asset ownership, storage namespace and recovery before migration. |
| Seeds and shared storefront inputs — `prisma/seed*.ts`, current Dealer Settings/CMS | Seeds use legacy global keys; public settings/CMS remain bound to the default dealer. Design explicit provisioning and scoped settings, content, cache and branding before activation. |

## Verification

| Check | Result |
|---|---|
| Prisma validate and Client generation | PASS, Prisma 6.19.0. Validation used a synthetic, nonresolving database URL. |
| ESLint, Next route type generation, TypeScript | PASS. |
| Full Vitest suite | PASS: 372 tests in 32 files, including 22 new DAL tests. Tests cover rejected and copied capabilities, no fallback, scoped query and mutation shapes, nested owner predicates, foreign-ID/slug and image denial, assignment rejection, authentication, and serialization-error propagation. |
| Production build | PASS, Next.js 16.3.5 webpack with synthetic staging configuration and a nonresolving database URL. |
| PostgreSQL and browser verification | NOT VERIFIED. No authorized disposable PostgreSQL target or local PostgreSQL runtime was available. The new tests mock Prisma and do not prove database constraint enforcement, query plans or concurrent execution. No application infrastructure was contacted. |

## Remaining activation gates

Verify trusted ingress, dealer membership and revocation with transaction-safe authorization, full legacy query/seed cutover, scoped media provenance and cleanup, and dealer-aware SEO/cache behavior. Use disposable PostgreSQL fixtures to verify the full migration chain, nullable legacy rows, cross-owner FK and direct-ID denial, stale domain contexts, races involving assignment/cover/delete and transaction rollback. Do not populate independent owned inventory while legacy unscoped paths are active. No database, domain, schema, deployment, authentication, or UI configuration was changed.

## Files changed

| File | Purpose |
|---|---|
| `server/inventory/context.ts` | Server-issued context and explicit legacy compatibility. |
| `server/inventory/reads.ts` | Scoped, bounded public inventory and taxonomy reads. |
| `server/inventory/mutations.ts` | Internal legacy CRUD and fail-closed registered/media contracts. |
| `tests/dealer-inventory-dal.test.ts` | Scoped DAL regression tests using Prisma/auth/registry doubles. |
| `docs/AUTOMOTIVE_STAGE4C2E4_IMPLEMENTATION_REPORT.md` | Baseline, audit, verification and activation gates. |
