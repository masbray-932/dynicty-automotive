# Stage 3C — Admin Authentication Hardening

Date: 23 October 2026 (UTC+07:00)

| Item | Result |
| --- | --- |
| Status | PASS WITH LIMITATIONS |
| Repository / branch | dynicty-automotive / main |
| HEAD and Git baseline | 69325e6c9e7a19c8e477e5420bf22e6ae70a959a |
| Prerequisite | Complete Stage 1–3B source present: 22 modified tracked files and 19 new files before Stage 3C |
| Cause | Parent layout authentication does not prevent child pages from independently querying/rendering into streamed HTML or Flight payloads |
| Resolution | Await authentication in every protected page and at sensitive admin service boundaries, before database/storage access |
| Stage 1–3B preservation | Captured 173-file pre-change snapshot; incremental changes are exported separately |
| Staging security certification | Pending authenticated PostgreSQL-backed tests and deployed-host verification |

## Authentication audit

| Entry point | Finding and implementation |
| --- | --- |
| Protected layout | Existing requireAdmin call retained; navigation and session email rendered only after authentication |
| Dashboard | Added page guard; dashboard service also guards before entering its query error handler |
| Brands/models page | Added guard before direct brand/model query |
| Vehicle list | Added guard before search parameters, all-status query, storage URL generation, and rendering |
| New vehicle | Added guard before brand/model options query |
| Vehicle edit | Added guard before parameters, vehicle/brand queries, form defaults, images, and serialization |
| Dealer settings page | Added page guard; read service also guards outside its fallback handler |
| CMS page | Existing page guard retained; added guard to getAdminDealerContent |
| Vehicle services | Eight exported admin operations now authenticate before database/storage access, including relation checks and image operations |
| Settings services | Four exported operations authenticate before reads, settings writes, logo upload/replacement/removal |
| Vehicle Server Actions | Seven existing action guards retained and regression-tested |
| Settings Server Actions | Three existing action guards retained and regression-tested |
| Master-data Server Actions | Two existing action guards retained and regression-tested |
| CMS Server Actions | Three existing action guards retained and regression-tested |
| Upload endpoints | Car images, logo and CMS media enter through guarded Server Actions; no separate upload Route Handler exists |
| Route Handlers | Only healthz Route Handler exists; returns minimal public health status, no protected data |
| Login / logout | Existing authentication, generic errors, limiter and logout flow retained; no changes to auth actions/session implementation |
| Public loaders | Homepage/catalog/detail/dealer presentation/public CMS remain public; AVAILABLE-only vehicle rules and active content filtering retained |
| Redirect handling | Guard runs outside query try/catch fallbacks, so NEXT_REDIRECT cannot be converted into a rendered data-error result |

## Changed files

| Files | Change |
| --- | --- |
| app/admin/(protected)/page.tsx | Direct page authentication |
| app/admin/(protected)/brands/page.tsx | Direct page authentication |
| app/admin/(protected)/cars/page.tsx | Direct page authentication |
| app/admin/(protected)/cars/new/page.tsx | Direct page authentication |
| app/admin/(protected)/cars/[id]/edit/page.tsx | Direct page authentication |
| app/admin/(protected)/settings/page.tsx | Direct page authentication |
| server/dashboard/service.ts | Guard before private inventory queries and outside fallback catch |
| server/cars/service.ts | Guard exported admin mutation/data boundaries |
| server/settings/service.ts | Guard settings reads and settings/logo writes |
| server/content/service.ts | Guard admin CMS read, preserve public CMS read |
| tests/admin-page-auth.test.tsx | Seven pages: denied access, pending authentication, authenticated rendering |
| tests/admin-service-auth.test.ts | Fourteen sensitive boundaries, redirect propagation, authenticated reads/writes and public-read compatibility |
| tests/admin-action-auth.test.ts | All fifteen protected action entry points reject before validation/side effects |
| scripts/verify-admin-auth.mjs | Full response-body HTML/RSC/prefetch runtime probe; optional staging cookie and private-data canary |
| docs/AUTOMOTIVE_STAGE3C_REPORT.md | This audit, verification results and limitations |

## Verification

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| pnpm lint | PASS | ESLint |
| pnpm exec next typegen | PASS | Route types generated |
| pnpm typecheck | PASS | TypeScript |
| pnpm test | PASS | 18 test files; 143 tests, including 55 new Stage 3C cases |
| pnpm build | PASS | Next.js 16.3.5 production build with isolated synthetic staging configuration |
| Production-mode local server | PASS | Real Next start bound to loopback; temporary test processes stopped |
| Anonymous HTML | PASS locally | Seven protected routes; entire response streams consumed and checked for private admin UI/data markers |
| Anonymous RSC navigation | PASS locally | Seven protected routes; correct text/x-component responses inspected, including late chunks and redirect markers |
| Anonymous RSC prefetch | PASS locally | Seven protected routes; deferred public shell contains no checked private markers; a deferred shell does not prove authenticated rendering |
| Anonymous runtime total | PASS locally | 21 response-body checks; login redirect or deferred shell; no private-query errors in captured runtime logs |
| Authenticated page/service access | PASS with mocks | Actual page/service functions executed against mocked session/database dependencies; not a PostgreSQL integration test |
| Authenticated production runtime | NOT VERIFIED | No database or valid staging session available in this workspace |
| Live staging HTML/RSC | NOT VERIFIED | No VPS access or deployment performed |
| Live login/logout/cookies/expiry | NOT VERIFIED | Requires the real isolated staging database and browser session |
| Live Server Action POSTs/uploads | NOT VERIFIED | Unit boundary coverage exists; repeat end-to-end on isolated staging |
| Schema/migrations | UNCHANGED | No schema change or database migration required or executed |
| Dependencies | UNCHANGED | No installation or dependency additions |
| Git index / commit / push | UNCHANGED / NONE / NONE | All source changes remain uncommitted |

## Runtime reproduction

| Step | Instruction |
| --- | --- |
| Anonymous probes | Run AUTH_TEST_BASE_URL=https://automotive-preview.dynicty.com node scripts/verify-admin-auth.mjs after applying and rebuilding Stage 3C on isolated staging |
| Authenticated probes | Operator supplies AUTH_TEST_COOKIE through a private temporary environment, plus AUTH_TEST_CAR_ID for an existing staging record; never print or commit the cookie |
| Private data canary | Supply AUTH_TEST_PRIVATE_MARKER with a unique seeded private record value; anonymous responses must never contain it |
| Wire format | Script uses the installed pinned Next version's RSC cache-key helper and validates text/x-component content type; review helper compatibility after a Next upgrade |
| Prefetch | Next may omit dynamic children during prefetch; navigation and HTML checks still require login redirect for anonymous access |
| Completion gate | Repeat with a real admin session, expired/invalid session, private DRAFT/SOLD records, CMS canaries and real Server Action POSTs; then inspect browser navigation/logout |

## Incremental patch contract

| Item | Requirement |
| --- | --- |
| Filename | dynicty-automotive-stage3c.patch |
| Apply order | Exact Git baseline, then complete Stage 1–3B cumulative patch, then Stage 3C incremental patch |
| Stage 1–3B patch SHA256 | cd62b96ddf6c3d7126dd7ba4d92a907dfdf37d2a9ff637b106c163c6f56e5fd6 |
| Scope | Only the fifteen Stage 3C files listed above |
| Export verification | Apply-check, actual apply and complete source-tree comparison are reported with the downloadable patch |
| Remaining certification blocker | Authenticated database-backed runtime and deployed-host re-verification remain required |

Final status: PASS WITH LIMITATIONS
