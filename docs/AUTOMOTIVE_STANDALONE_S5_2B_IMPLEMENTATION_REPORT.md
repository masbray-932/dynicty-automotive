# Automotive Standalone S5.2B — implementation evidence

| Item | Verified result |
|---|---|
| Verdict | **PASS WITH LIMITATIONS** |
| Main baseline | `69c5ee0c2ed05ef36a80a1b4d046034c23311c4d` (GitHub main independently rechecked) |
| Branch | `feat/automotive-standalone-s5-2b-cms-foundation` |
| Implementation commit | The commit containing this report; obtain its immutable SHA from the PR head or `git rev-parse HEAD`. The final delivery includes the exact SHA. |
| Prerequisite audit | S5.2A audit supplied locally as `docs/AUTOMOTIVE_STANDALONE_S5_2A_STRUCTURE_CMS_AUDIT.md` in the existing S5.1 worktree; inspected without modifying it. It is not on the verified baseline and is not silently reconstructed or included as an unrelated change. |
| Scope | Additive persistence, Admin CMS, public server-side published readers, controlled fictional demo infrastructure |
| Live infrastructure | No staging/customer database, DNS, service, certificates, storage or production deployment changed |

## Implemented capabilities

| Area | Implementation and evidence |
|---|---|
| Categories | `/admin/services`: create/edit/active/order/delete; capped at 100 categories, normalized owner-unique slug; deletion refused while services remain. |
| Services | Same Admin route: title, slug, owned category, summary/body, optional validated image and alt, draft/publication, homepage flag, order and confirmed deletion. |
| Articles | `/admin/articles`: title, slug, excerpt/body, optional cover/alt, draft/publication, confirmed edit/delete; publication time is server-owned, preserved on published edits and cleared on unpublish. |
| Testimonials | Existing `DealerContentItem` adds `TESTIMONIAL`: authorized attribution, quote, active flag, order; no link, ratings, customer account or review-submission system. |
| Company profile | Existing singleton gains optional history, vision, mission, achievements. Existing fields and default ID remain unchanged. Older form submissions omitting these fields preserve stored values; explicit empty values clear them. |
| Draft retention | Controlled text/select/checkbox drafts survive server validation errors. Browsers intentionally do not retain file selection after submission; select a file again if validation fails. |
| Feedback/accessibility | Existing confirmation and FormField patterns reused. Field errors have associated labels/IDs; one page-level viewport notification reports outcomes. Inline status remains near its form. Existing dialogs and logout workflow preserved. |
| Navigation | Added Admin Layanan and Artikel links; no public navigation or design replacement. |
| Published readers | `getPublishedServices`, `getPublishedArticles`, `getPublishedEditorialBySlug` return only legacy-owner published content; services additionally require an active same-owner category; future timestamps excluded from articles. |
| Listing bounds | Admin 20 services/articles per page; categories 100; public 12 per page; page clamped to 1–1000. Existing CMS cap adjusted to 180 for six kinds × 30. |

## Schema and migration

| Change | Invariant |
|---|---|
| `ServiceCategory` | Stable cuid ID; FK to DealerSettings; owner/slug unique; composite owner/ID unique; active/order index; normalized slug and bounded order CHECK. |
| `ShowroomService` | FK to settings and composite `(dealerSettingsId, categoryId)` FK to category `(dealerSettingsId, id)` prevents cross-owner relationships in PostgreSQL; owner/slug unique; publication/home/order and category indexes. |
| `Article` | Owner FK and owner/slug unique; publication index; normalized slug CHECK; DRAFT requires NULL publication timestamp, PUBLISHED requires timestamp. |
| `ContentPublicationStatus` | Explicit DRAFT/PUBLISHED enum. |
| `DealerContentKind` | Additive TESTIMONIAL value. |
| `DealerContent` | Four text columns with empty defaults; existing relations and singleton primary key unchanged. |
| Migration | `20261109000000_standalone_editorial_cms/migration.sql`; generated from the actual schema difference, then reviewed with explicit SQL CHECKs. |
| Preserved | All earlier migrations, global inventory uniqueness, nullable inventory ownership, partial unique primary-image index, current IDs, settings colors, sessions, and CMS foreign keys. No ownership backfill or registered dealer creation. |
| Rollback | Previous code can ignore additive columns/tables; do not reverse migration by dropping customer content. Back up DB and media before future installation upgrades. A code rollback does not reverse Prisma migrations; restore only into a separately validated recovery database when necessary. |

## Authentication, ownership and mutation boundaries

| Boundary | Enforcement |
|---|---|
| New Admin pages | Direct `requireAdmin()` before calling data loaders; loader independently requires Admin. |
| New Server Actions | Independent `requireAdmin()` before parsing; existing Next Server Action origin/request model retained. |
| Direct mutation services | Independent `requireAdmin()`, strict Zod parsing, runtime kind validation, hardcoded trusted legacy scope. No client owner field, publication timestamp, storage key or arbitrary URL accepted. |
| Owner-qualified reads/writes | `dealerSettingsId = default` plus related `DealerSettings.dealerId IS NULL`; edits/deletes use qualified selectors. No unknown dealer fallback or registered-dealer activation. |
| Atomic relation changes | Settings row lock inside transaction serializes owned CMS updates; category ownership checked under lock and enforced by composite FK. Used categories cannot be deleted. |
| Public exposure | New readers are server-only, bounded and publication-filtered. No new public service/article route is exposed in this stage. They return server-side records; future rendering must map media through the safe URL helper, escape text and never serialize raw records/storage keys wholesale. |
| Error handling | Safe field messages; duplicate slugs reported without DB internals. Unexpected errors log fixed event names, not payloads, paths, passwords, credentials or tokens. |
| Revalidation | Admin/list/home/sitemap and old + new slug detail paths invalidated after commit. A cache failure returns a warning without discarding committed media/data. No tenant cache or request-host identity was introduced. |

## Media handling

| Area | Result |
|---|---|
| Validation | Existing JPEG/PNG/WebP signature + decoder validation, 8 MiB upload cap and 25 megapixel cap reused. Arbitrary non-file inputs rejected. |
| Namespace | `dealers/default/editorial/service/<server-generated-id>.<ext>` and `.../article/...`; no client-supplied storage key/path, filename-derived key, owner or executable extension. |
| Rendering | Admin preview uses the validated generated public media URL; local persistent uploads bypass Next optimization per existing architecture. |
| Upload failure | Generic image feedback; no row committed. DB failure after upload triggers compensation. |
| Replacement/delete | Commit reference changes before cleanup. Check all six existing/new reference families before deleting an editorial object; referenced/shared objects retained. Failed cleanup returns warning for operator follow-up. |
| Consistency limitation | DB/filesystem operations are compensated, not a distributed transaction. An outage can leave orphan media; warnings and operator reconciliation remain necessary. Arbitrary raw DB writers are outside this application's locking/ownership model. |
| Local byte delivery | Real PNG uploads and replacement verified through disposable HTTPS Nginx; bytes equal fixture bytes, content type image/png, browser decoder succeeds, replaced cover URL returns 404. |
| R2 | No new R2 implementation or production claim. Existing R2 network limitations remain. |

## Demo seed contract

| Item | Safeguard |
|---|---|
| Invocation | `pnpm db:seed:demo`, explicit operator only; never startup/build/migration/deployment. See `docs/DEMO_CONTENT.md`. |
| Guard | DEMO_CONTENT=true, non-production NODE_ENV, explicit development/staging deployment environment, local provider, loopback demo database name, actual DB identity check. |
| Existing data | Refuses customer identity, registered dealers/domains, inventory and unknown CMS records. Does not create or rotate administrators or credentials. |
| Repeatability | Advisory transaction lock, stable IDs, empty upsert updates; operator edits preserved. New unknown records deliberately cause later seed refusal. |
| Content | Clearly fictional Dynicty Auto Demo, original Indonesian welcome/profile/history/vision/mission, categories/services, two full articles, advantages and FAQ. No awards or transaction guarantees. |
| Testimonials/partners | No testimonials seeded. Promo and leasing examples inactive, clearly noncommercial, no real partner logos or invented partnerships. |
| Media | Locally generated neutral PNG placeholders, exclusive writes, refuse different existing bytes and symlinked child directories. Dedicated real media root must match public/uploads target. |
| Partial failure | DB safety transaction precedes file creation; file error can leave inactive placeholder references. Correct isolated filesystem setup and rerun; do not bypass safety guards. |
| Cleanup | Operator verifies/stops the disposable installation and removes only its dedicated DB/media resources. No destructive reset endpoint or customer cleanup command added. |

## Verification environment and results

| Check | Actual result | Evidence/limits |
|---|---|---|
| Prisma format check, validate and generate | PASS | Prisma 6.19.0, PostgreSQL schema, generated Client; no package upgrades. |
| Clean migration | PASS | All seven migrations applied to fresh loopback PostgreSQL 17.11 database. |
| Legacy migration | PASS | First six migrations applied independently in old baseline worktree; representative settings, profile/FAQ, admin/session, brand/model/car and primary image inserted; seventh migration applied without changing existing values/relations. |
| Legacy negative check | PASS | Duplicate primary image rejected by preserved unique index; inventory remained dealerId=NULL and AVAILABLE; profile additions empty by default. |
| Real PostgreSQL editorial tests | PASS | Four integration cases: seed idempotency/edit preservation, service/category CRUD, cross-owner FK rejection, unique/CHECK rejection, public draft/foreign exclusion. Authentication explicitly stubbed only for these service tests. |
| Full Vitest with disposable DB | PASS | **465 tests passed, 41 files passed, 0 failed, 0 skipped**. Includes 435 baseline tests and 30 added tests. Without explicit disposable DB variable the four integration cases are skipped, not treated as passes. |
| ESLint | PASS | `pnpm lint`. |
| TypeScript | PASS | `pnpm typecheck` following Next route type generation. |
| Next typegen | PASS | `pnpm exec next typegen`. |
| Production build | PASS | Next.js 16.3.5, React 19, webpack production build; isolated staging configuration, no external DB access. |
| Whitespace | PASS | `git diff --check`. |
| Browser | PASS within executed scope | Chromium 156 / Playwright 1.62.1, real production build, disposable PG and Nginx 1.26.3 HTTPS loopback. Seven scenario groups passed; no pageerror events. |

### Browser execution matrix

| Scenario | Result | Scope |
|---|---|---|
| Unauthenticated services/articles | PASS | Responses do not contain seeded editorial records; login required. |
| Login | PASS | Real seeded disposable admin and database-backed session. |
| Category/service workflow | PASS | Create active category, create published service with image, verify image bytes/decode, unpublish, delete service/category with dialogs. |
| Article workflow | PASS | Published validation error retains title; then create/publish with cover, replace cover and verify old object cleanup, unpublish and delete. |
| Responsive pages | PASS | `/admin/services`, `/admin/articles`, `/admin/content` at 390, 768, 1280 px: nine layout checks, no horizontal overflow. Full CRUD interactions executed at desktop, not all three viewports. |
| Profile/testimonials | PASS | History/vision/mission saved and reloaded; inactive QA testimonial created/deleted. No real testimonial published. |
| Logout | PASS | Existing immediate logout without confirmation. |
| Console scope | PASS / limitation | No uncaught pageerror events recorded. This is not a complete network/CSP/accessibility audit or full commercial browser certification. |

Early disposable harness runs required fixing test selectors after a publication label changed and supplying a password meeting the existing bootstrap policy. Those were harness/setup corrections, not application defects; they are not counted as successful runs. The final complete run above passed.

## Exact changed files

| File | Change |
|---|---|
| `app/admin/(protected)/articles/page.tsx` | Added |
| `app/admin/(protected)/content/page.tsx` | Modified |
| `app/admin/(protected)/services/page.tsx` | Added |
| `components/admin/admin-nav.tsx` | Modified |
| `docs/AUTOMOTIVE_STANDALONE_S5_2B_IMPLEMENTATION_REPORT.md` | Added |
| `docs/DEMO_CONTENT.md` | Added |
| `features/content/cms-feedback.tsx` | Added |
| `features/content/content-editor.tsx` | Modified |
| `features/content/domain.ts` | Modified |
| `features/content/editorial-editor.tsx` | Added |
| `package.json` | Modified |
| `prisma/demo-content.ts` | Added |
| `prisma/migrations/20261109000000_standalone_editorial_cms/migration.sql` | Added |
| `prisma/schema.prisma` | Modified |
| `prisma/seed-demo.ts` | Added |
| `server/content/actions.ts` | Modified |
| `server/content/service.ts` | Modified |
| `server/editorial/actions.ts` | Added |
| `server/editorial/service.ts` | Added |
| `services/storage/key.ts` | Modified |
| `tests/content-actions.test.ts` | Modified |
| `tests/editorial-foundation.test.ts` | Added |
| `tests/editorial-pages.test.tsx` | Added |
| `tests/editorial-postgres.test.ts` | Added |
| `tests/stage4b1-image-rendering.test.tsx` | Modified |
| `validation/dealer-content.ts` | Modified |
| `validation/editorial.ts` | Added |

## Remaining limitations and S5.2C handoff

| Item | Required next-stage action |
|---|---|
| Public website | Implement service/category and article listing/detail plus customer-approved homepage/navigation. These routes, visual redesign and Google Stitch integration are intentionally absent here. |
| Search | Preserve all six existing search fields, brand→model dependency, GET query semantics and catalog integration; existing regressions remain passing. |
| Text safety | Render new descriptions/articles/quotes as escaped text. No raw HTML or WYSIWYG pipeline introduced. |
| Hidden content | Keep empty/inactive sections hidden, draft articles/services excluded, inactive categories hiding services and testimonials absent unless genuine authorized content is supplied. |
| SEO | Add metadata/sitemap behavior for new public routes only when those routes are implemented. Trusted configured origin and staging noindex remain unchanged. No request-header canonical construction. |
| Demo media | Neutral placeholders are not final banner/partner assets. Keep promo/partner examples inactive until safe presentation and labels are implemented. Optional demo vehicles not seeded. |
| Runtime resources | Run new migration only through the operator's reviewed deployment workflow with backup; this stage never changed live databases. |
| Browser coverage | Desktop CRUD and three-width layout smoke executed. Expanded mobile/tablet interactions, complete keyboard audit, live customer hostname/TLS/systemd and deployment acceptance remain unverified. |
| Commercial certification | Not granted. Local PostgreSQL/browser success does not certify customer infrastructure. |
| Delivery | Feature branch/PR only; no merge, deployment, DNS changes, live DB operations or ownership backfill. |
