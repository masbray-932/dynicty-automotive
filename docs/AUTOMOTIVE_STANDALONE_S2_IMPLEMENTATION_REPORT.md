# Dynicty Automotive — Stage S2: Standalone runtime foundation

**Verdict: PASS WITH LIMITATIONS.** Standalone runtime checks passed against PostgreSQL 17.11 and the built app. Customer ingress, durable storage on the real host, backup restore, and browser acceptance remain commercial release gates.

| Baseline | Evidence |
|---|---|
| GitHub repository and main | `masbray-932/dynicty-automotive`, `4ff9de99d23e96caea5315c40cf1b0a47d9091aa` (merge of PR #12), matching the requested baseline. |
| Delivery | `feat/automotive-standalone-s2-runtime`; isolated worktree. No direct changes to main. |
| Audit inputs | Prisma schema and all six migrations, Stage 4C.2D through 4C.2E.5 architecture/implementation reports, Stage 4C.2E.5 post-merge evidence, Admin/session/authorization code, storefront query and metadata paths, settings/CMS, storage key/providers, startup validation, Nginx examples, and existing regression tests. |

| Architectural decision | Implementation and compatibility |
|---|---|
| One installation, one legacy scope | Standalone runs with existing nullable ownership fields and `DealerSettings.id = default` with no registered owner. Existing public inventory predicates and routes are unchanged. No Dealer creation, provisioning, Dynicty integration, ownership backfill, schema change, or migration removal. |
| Admin inventory and taxonomy | Dashboard/list/edit/new/brands queries qualify NULL ownership, including brand/model/image relationships. Existing session and permission checks still run first. Vehicle CRUD, brand/model changes and image mutations scope final Prisma predicates, and related ownership checks and writes use serializable transactions where needed. Existing global unique indexes still apply; a mixed fixture can cause a uniqueness conflict without exposing the owned record. |
| Vehicle media | Upload checks a scoped vehicle before writing and again before inserting metadata. Image changes qualify both image and parent, retain primary/reorder and cleanup behavior, and only delete file keys from the scoped vehicle namespace. Media cleanup errors can leave orphan files for operator review. Public file reads do not enforce byte-level authorization. |
| Settings, branding, CMS | Public/admin settings reads, operational updates and CMS paths remain on the default legacy settings row and reject a default row linked to a registered owner. No branding write endpoint or Dynicty dependency added; current logo/color protection remains. |
| Primary administrator | Existing AdminUser, AdminSession, cookies, guards, login, origin checks and authorization retained. There is no runtime account-create route. Both operator seeds use the same PostgreSQL transaction lock and reject a second identity or multiple existing accounts. Same credentials do not change sessions; rotating the existing password revokes existing session rows. No existing extra accounts are deleted or disabled automatically; reconcile them before onboarding, and pause login traffic for immediate rotation enforcement. The normal seed no longer adds demo taxonomy. |
| Production startup and storage | Explicit standalone opt-in allows local storage in production while preserving staging opt-in and existing R2 configuration parsing. Production canonical URL must be a bare HTTPS origin. One private app service, dedicated PostgreSQL/database credentials and media directory, HTTPS hostname allowlist and persistent upload mount are operator requirements. R2 put/delete are still unavailable. |
| SEO and streaming | Existing canonical URL and metadata continue to use configured origin; header-based tenant selection is not enabled. Reviewed the 4C.2E.5 HTTP evidence and local Next.js 16.3.5 streaming documentation. An excluded detail can stream not-found/noindex with HTTP 200 after headers are committed. The standalone contract documents monitoring and a pre-stream lookup if a consumer strictly requires transport 404; no risky proxy rewrite or unrelated route rewrite. |

Installation, ingress, secrets, media, admin bootstrap, migrations, backup/restore and rollback: [Automotive standalone installation contract](./AUTOMOTIVE_STANDALONE_INSTALLATION.md).

| Verification | Result |
|---|---|
| Prisma 6.19.0 validate and Client generation | PASS |
| ESLint, Next route type generation, TypeScript and diff check | PASS |
| Vitest | PASS: **398 tests in 34 files**, including 13 new targeted standalone cases. |
| Production webpack build | PASS, Next.js 16.3.5 with synthetic standalone environment and a nonresolving build-time database URL. |
| Disposable PostgreSQL | PASS, real PostgreSQL **17.11** on loopback. All six migrations applied; status up to date. Twenty-two vehicles included two registered dealers and deliberately mixed ownership, with four FK violations rejected. No staging/production connection. |
| Real DB Admin/services | PASS. Verified concurrent single-admin bootstrap, repeat and rotation, real DB session revocation, dashboard scoped to 18 legacy vehicles, rejection of foreign/mixed vehicle and media writes, legacy CRUD, upload/primary/reorder/delete, local filesystem cleanup, protection against deletion via a foreign storage key, and registered-linked settings/CMS rejection. Framework request cookies and revalidation were stubbed only for the direct service harness; Prisma and storage were real. |
| Built app HTTP | PASS. Same local DB and production-mode server verified public homepage/catalog/detail/sitemap, authenticated dashboard/list/taxonomy/new/edit, foreign edit denial and unauthenticated route protection. A valid HMAC-backed session lookup was exercised by providing the harness-created cookie; this is not a browser login or deployed HTTPS test. |
| Browser, real ingress and customer deployment | NOT VERIFIED. No claim of commercial readiness; complete browser onboarding/login/Admin CRUD and media QA, customer hostname/TLS/forwarding policy validation, upload alias/mount verification, backup restore drill, and operator branding workflow before release. |

| Changed files | Purpose |
|---|---|
| `server/standalone/inventory.ts`, `server/{cars,dashboard}/service.ts`, `server/master-data/actions.ts` | Shared legacy ownership predicates and scoped Admin operations. |
| `app/admin/(protected)/brands/page.tsx`, `app/admin/(protected)/cars/page.tsx`, `app/admin/(protected)/cars/new/page.tsx`, `app/admin/(protected)/cars/[id]/edit/page.tsx` | Scoped Admin listing, forms and preview URLs. |
| `server/content/{actions,service}.ts`, `server/{settings,homepage}/service.ts` | Legacy dealer settings, CMS ownership and public presentation. |
| `prisma/{primary-admin,seed,seed-staging}.ts` | Operator-only primary-admin policy and legacy seed boundaries. |
| `server/env-schema.ts`, `.env.example`, `docs/DEPLOYMENT.md`, `docs/AUTOMOTIVE_STANDALONE_INSTALLATION.md` | Startup contract and operator documentation. |
| `tests/standalone-runtime.test.ts`, `tests/{content-actions,dealer-authorization,stage4b1-actions}.test.ts`, `tests/dealer-branding-protection.test.tsx` | New standalone regressions and updated existing mocks for the new predicates. |
| `docs/AUTOMOTIVE_STANDALONE_S2_IMPLEMENTATION_REPORT.md` | This audit and verification report. |

No live databases, assets, DNS, infrastructure, schema or deployment were changed. Registered storefront activation and SaaS integration remain out of scope.
