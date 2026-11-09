# Automotive Standalone S5.2C — complete public structure and demo

| Item | Verified result |
|---|---|
| Final verdict | **PASS WITH LIMITATIONS** |
| Verified GitHub main | `f5dd3d639f1db60c03b5407c77cdadc915c56c77` (merged S5.2B, exact expected baseline) |
| Feature branch | `feat/automotive-standalone-s5-2c-public-website` |
| Commit identity | The immutable commit containing this report is the PR head; exact SHA provided in delivery. Use `git rev-parse HEAD` after fetching the feature branch. |
| Required audit | S5.2A audit inspected from the preserved original worktree; supplied locally, not on main. S5.2B report, demo documentation, deployment contracts, actual public/CMS/search/theme/media/auth source inspected. |
| Working tree safety | Separate feature worktree from verified main; existing S5.2A untracked audit preserved. Main not edited, no destructive Git operations. |
| Delivery boundary | Source/tests/docs only; local disposable QA. No merge, live deployment, external migrations, customer records, DNS, certificates, VPS, systemd or live staging changes. |
| Visual scope | Existing dark presentation and ten-token foundation preserved. This is public structure/content implementation, not the final Stitch light redesign. |

## Public route and navigation coverage

| Label | Route | Result |
|---|---|---|
| Beranda | `/` | Shared approved navigation and ordered CMS sections |
| Tentang Kami | `/about` | Existing page extended with optional history, vision, mission, achievements |
| Layanan | `/services` and `/services/[slug]` | Published listing/category filter/server pagination/detail |
| Jual Mobil | `/sell-car` | Client-only validated WhatsApp inquiry |
| Beli Mobil | `/cars` and existing `/cars/[slug]` | Existing catalog/detail/search preserved |
| Artikel | `/articles` and `/articles/[slug]` | Published bounded listing, escaped body, cover/date and detail |
| Kontak Kami | `/contact` | Shared authoritative dealer contact/location/hours |

`components/public/navigation.ts` is the single seven-link contract for desktop, mobile and footer. WhatsApp/contact CTAs are outside those navigation link groups. Desktop breakpoint moved to xl to accommodate seven full labels. No Tim Sales, inquiry inbox, CRM, financing, tenant selection or SaaS capability was introduced.

## Homepage ordering

| Position | Section | Data and optional behavior |
|---|---|---|
| 1 | Hero / Welcome | Existing single-upload carousel + editable welcome; unchanged banner interaction and ratios |
| 2 | Vehicle Search | Existing QuickSearch unchanged: six fields and GET `/cars` |
| 3 | Promo Bulan Ini | Existing active promo items; no automatic scheduling claims |
| 4 | Kategori Merek Mobil | Existing scoped AVAILABLE brand data; links into catalog brand filter |
| 5 | Daftar Stok Mobil | Existing featured/latest composition, maximum six AVAILABLE vehicles |
| 6 | Layanan Showroom | At most six published homepage-visible services in active same-owner categories |
| 7 | Kenapa Memilih Kami | Existing factual ADVANTAGE CMS items |
| 8 | Testimoni Pelanggan | Existing TESTIMONIAL kind rendered only for active nonempty quotes/attribution; demo seeds none, so section hidden |
| 9 | Partner Leasing | Existing media presentation; demo artwork and visible CMS title explicitly state no partnership |
| 10 | Sekilas Tentang Kami | Same optional profile summary as /about source |
| Additional | FAQ | **After about summary, before Kontak & Lokasi**; existing CMS, data and native details interaction retained |
| 11 | Kontak & Lokasi | DealerSettings plus operating hours; safe map link, not arbitrary iframe |
| 12 | Footer | Existing identity/contact content and seven approved links |

Empty/inactive optional sections remain hidden. Company profile subsections additionally require aboutActive and nonblank text. No fabricated achievements, star ratings, customer quotes or real leasing partnerships were added.

## CMS and public data boundaries

| Boundary | Implementation |
|---|---|
| Authoritative content | Reuses S5.2B `getPublishedServices`, `getPublishedArticles`, `getPublishedEditorialBySlug`; common `publishedEditorialWhere` now used by readers/counts/gates/sitemap. |
| Owner | Server-fixed DealerSettings `default`, parent registered dealerId NULL. Categories must share the same owner and be active. No client owner selection, hostname-based dealer authorization, registered-dealer routing or NULL inventory backfill. |
| Publication | Draft, future-dated article, inactive category and foreign-owner content excluded. Existing AVAILABLE/NULL ownership predicates remain unchanged for cars/brands/models/images. |
| Presentation | Explicit DTO removes owner/storage fields; only safe derived media URLs passed to renderers. React escapes article/service/profile/testimonial text; no raw HTML, unsafe URL or WYSIWYG dependency. |
| Bounds | Public listing 12/page, page 1–1000, categories 100, homepage services 6, sitemap 1000/type. Counts and rows share ownership/publication rules. |
| Metadata | Configured metadataBase/trusted site URL; fixed canonical paths. Any listing query combination noindex/follow; staging-wide noindex header and robots disallow retained. |
| Structured data | Existing ownership-qualified Vehicle JSON-LD preserved. No invented reviews/ratings/business awards or unsupported structured data added. |
| Cache | No shared persistent CMS cache introduced. Detail uses request-local React cache for metadata/render; revalidation covers old/new slugs and home/list/detail/sitemap; settings/profile invalidation includes new consumers. |
| Media | Existing validated provider and namespace/key checks reused. Public media is intentionally public; filtering DB rows is not asset-byte authorization. Local persistent uploads bypass optimization under the existing policy. |
| Administration | S5.2B authentication/authorization, confirmation dialogs, media compensation, operational settings and branding preserved. Real Admin publish/unpublish propagation tested. |

## Selling inquiry

| Area | Behavior |
|---|---|
| Fields | Name, contact, brand, model, year, transmission, mileage, expected price and optional notes |
| Validation | Strict client schema; required text, normalized contact, integer year/ranges, nonnegative mileage, positive bounded price and bounded notes. Blank numbers rejected. |
| Submission | Explicit prepare action creates encoded `https://wa.me/<configured-number>?text=...`; user reviews and chooses to send in WhatsApp. No automatic message sending. |
| Privacy | No public POST/API/Server Action or database persistence; no logging of inquiry data. SSR fieldset is disabled until hydration to prevent accidental native GET leakage if JS has not initialized. |
| Missing configuration | Clear unavailable message and contact-page link. No fabricated fallback showroom number at runtime. |
| Demo number | Seed uses fictional `12025550123`, clearly documented as non-service/unverified; not contacted during QA. Replace/clear via Admin for an authorized real installation. |
| Expectations | Message/page explicitly exclude appraisal or purchase guarantees. |

## Demo content and seed safety

| Content | Fresh seed result |
|---|---|
| Identity/profile | Dynicty Auto Demo, explicitly fictional address/contact/hours; welcome/story/history/vision/mission; no achievements |
| Services | 2 categories and 4 meaningful demonstration entries, editable in existing Admin |
| Articles | 4 complete original Indonesian educational articles with generated covers |
| Vehicles | 16 stable fixtures: **14 AVAILABLE, 1 DRAFT, 1 SOLD**, 4 brands, 8 models, NEW/USED, multiple years/prices/transmissions, featured units |
| Images | 16 original geometric vehicle illustrations, four article covers, main/promo/leasing/showroom artwork. PNGs generated locally using Sharp and passed through existing decoder/MIME/8 MiB/25 MP validation. Not manufacturer photos or real unit representations. |
| Promo/partners | Clearly labeled demo-only artwork; no real offer, discount, warranty, brand logo or partnership. No external hotlinks/assets. |
| Testimonials | None; section hidden until genuine authorized content is supplied |
| Guard | Explicit operator invocation; non-production NODE_ENV; dedicated loopback demo DB; actual current_database check; isolated matching media root; no startup/build/deploy seed |
| Known inventory | Stable allowlisted IDs permitted only with NULL owner, expected brand/model/car relationships and media-key associations. Unknown customer IDs/owners/relationships refused. |
| Idempotency | Empty upsert updates preserve operator text, price/status and other ordinary edits. Additional/changed image associations or unrelated records cause refusal rather than overwrite. |
| Filesystem | Versioned original asset names, exclusive writes, refuse different bytes and symlinked child paths. Existing S5.2B rows/assets remain untouched on upgrade/rerun; operators may explicitly publish/edit old inactive presentation. |
| Production refusal | Real CLI invocation with NODE_ENV=production refused before content changes; no credentials created by demo seed. Separate existing primary-admin operator bootstrap reused for disposable browser QA. |
| Partial failure | DB and filesystem are not one transaction. A file-generation failure can leave references without assets; correct isolated setup and rerun before exposing preview. No automatic public deployment. |

## Verified environment and validation

| Check | Actual result | Evidence / scope |
|---|---|---|
| Stack | VERIFIED | Next 16.3.5 / React 19 / Prisma 6.19.0; no dependency upgrades |
| PostgreSQL | VERIFIED | Disposable local PostgreSQL 17.11; independent databases only |
| Clean migration | PASS | Existing seven migrations applied from empty DB; no new schema or migration required by S5.2C |
| Legacy migration | PASS | Baseline S5.1 first six migrations + representative settings/profile/FAQ/admin/session/brand/model/car/primary-image fixture, then seventh migration; preserved colors/default IDs/NULL owner/session/CMS; duplicate primary image rejected |
| Prisma validate/generate | PASS | Actual commands executed against schema; Client generation successful |
| Full Vitest | PASS | **486 tests / 42 files, 0 failed, 0 skipped** with explicit disposable DB. Baseline 465 plus 21 additional tests. Without DB opt-in, 5 integration cases skip and must not be counted as passing. |
| Integration scope | PASS | Real CMS CRUD/publication, seed idempotency and operator edits, unknown inventory refusal, malformed known media association refusal, composite FK/unique/CHECK rejection, real article pagination 12+5 from 17 published while excluding foreign/draft. Auth and pure URL provider stubbed only in these DB service tests. |
| ESLint | PASS | pnpm lint |
| Next typegen | PASS | pnpm exec next typegen |
| TypeScript | PASS | pnpm typecheck |
| Production build | PASS | Webpack build with validated isolated staging environment; all six new route patterns present |
| Browser | PASS in executed scope | Chromium 156 / Playwright 1.62.1, production build + disposable PG + Nginx 1.26.3 HTTPS |
| Whitespace | PASS | git diff --check |
| Schema/package/deploy drift | NONE | No schema, SQL migration, package/lockfile, authentication, deployment-template or theme-token changes |

## HTTP 404 defect and correction

A real HTTPS test reproduced **500** for an excluded detail URL: Next internal rewrite attempted TLS to the local HTTP upstream (`wrong version number`). The publication query was correctly denying the row; transport rewriting was failing behind TLS termination.

`publicNotFoundResponse` now returns a fixed, data-free, accessible Indonesian HTML 404 directly. It contains viewport/noindex metadata and a home link, with no record/request interpolation or private data. HEAD and RSC return bodyless 404 rather than fabricated Flight payloads. The same boundary preserves actual negative vehicle semantics while extending to services/articles; normal published responses are unaffected. No Nginx blanket rewriting was added.

| Actual path | HTML | RSC | HEAD |
|---|---:|---:|---:|
| `/services/missing` | 404 | 404 | 404 |
| `/articles/missing` | 404 | 404 | 404 |
| `/services/qa-hidden-service` | 404 | 404 | 404 |
| `/articles/qa-hidden-article` | 404 | 404 | 404 |
| `/cars/demo-car-15` | 404 | 404 | 404 |
| `/cars/demo-car-16` | 404 | 404 | 404 |
| `/cars/unknown` | 404 | 404 | 404 |
| `/cars/qa-registered-car` | 404 | 404 | 404 |
| `/cars/qa-mixed-car` | 404 | 404 | 404 |
| `/services/qa-foreign-service` | 404 | 404 | 404 |
| `/articles/qa-foreign-article` | 404 | 404 | 404 |
| `/cars/demo-car-01` | 200 | 200 | 200 |
| `/services/penelusuran-katalog` | 200 | 200 | 200 |
| `/articles/menyusun-anggaran-pembelian-mobil` | 200 | 200 | 200 |

**42 checks:** 33 excluded = 404; 9 published = 200. Negative bodies contain no private fixture marker. The foreign registry fixture was PENDING, had no domain binding and existed only in the disposable verification DB; no registered storefront was activated. Separate gate and render reads still have an availability-change race: page-level ownership/publication checks prevent hidden data rendering, but atomic status guarantees under concurrent publication were not claimed or tested.

## Browser and responsive evidence

| Executed scenario | Result |
|---|---|
| Published/excluded HTML/RSC/HEAD matrix | PASS, as above |
| Homepage ordering and testimonial hiding | PASS; required nonempty sections in order; FAQ before contact; no fake testimonials |
| Six-field search / brand-model interactions | PASS; all six exact GET parameters, model reset, prior-brand option removal, exact price/condition result |
| Catalog | PASS; 14 AVAILABLE, page 2 shows remaining 2; transmission/year filtering and sort retained |
| Service/article integration | PASS; four services, category filter to two, published detail navigation; four articles and detail |
| Inquiry | PASS; validation retains draft, encoded message reviewed, **zero POST requests** to application |
| SEO | PASS; trusted canonical, filtered listing noindex, staging headers/robots, published-only sitemap without foreign or hidden rows |
| Responsive | PASS; ten public routes × 390/768/1280 px = **30 no-overflow checks**; keyboard mobile menu interaction at 390/768 and desktop seven-link navigation |
| Media | PASS; generated PNG loads/decodes through HTTPS ingress; content type image/png; response bytes equal isolated stored file |
| Admin propagation | PASS; real login, service/article unpublish→404 and sitemap exclusion, republish→200, logout; warm public requests did not retain published content |
| Runtime errors | None captured in final browser run (pageerror + console error listeners). Not a full WCAG/security/performance audit. |
| Committed browser regression | `scripts/verify-six-field-search.mjs`: **6 checks PASS** against local production build. Includes sorting preserving all six filters and pagination. Operator usage in docs/DEMO_CONTENT.md; optional external Playwright, no app dependency. |

Initial harness runs needed selector disambiguation and explicit waits for client navigation; those were test corrections, not application fixes. One actual application defect (HTTPS negative rewrite→500) was fixed and then reverified. Only final successful evidence above is counted.

## Exact changed-file inventory

| File | Change |
|---|---|
| `app/(public)/about/page.tsx` | Modified |
| `app/(public)/articles/[slug]/page.tsx` | Added |
| `app/(public)/articles/page.tsx` | Added |
| `app/(public)/contact/page.tsx` | Added |
| `app/(public)/page.tsx` | Modified |
| `app/(public)/sell-car/page.tsx` | Added |
| `app/(public)/services/[slug]/page.tsx` | Added |
| `app/(public)/services/page.tsx` | Added |
| `app/not-found.tsx` | Modified |
| `app/sitemap.ts` | Modified |
| `components/public/navigation.ts` | Added |
| `components/public/site-footer.tsx` | Modified |
| `components/public/site-header.tsx` | Modified |
| `docs/AUTOMOTIVE_STANDALONE_S5_2C_IMPLEMENTATION_REPORT.md` | Added |
| `docs/DEMO_CONTENT.md` | Modified |
| `features/content/public-sections.tsx` | Modified |
| `features/editorial/public-content.tsx` | Added |
| `features/sell-car/domain.ts` | Added |
| `features/sell-car/inquiry-form.tsx` | Added |
| `prisma/demo-content.ts` | Modified |
| `prisma/demo-inventory.ts` | Added |
| `prisma/demo-media.ts` | Added |
| `prisma/seed-demo.ts` | Modified |
| `proxy.ts` | Modified |
| `scripts/verify-six-field-search.mjs` | Added |
| `server/content/actions.ts` | Modified |
| `server/editorial/metadata.ts` | Added |
| `server/editorial/public-scope.ts` | Added |
| `server/editorial/public.ts` | Added |
| `server/editorial/publication.ts` | Added |
| `server/editorial/service.ts` | Modified |
| `server/settings/actions.ts` | Modified |
| `server/storefront/not-found-response.ts` | Added |
| `tests/content-pages.test.tsx` | Modified |
| `tests/editorial-postgres.test.ts` | Modified |
| `tests/public-website.test.tsx` | Added |
| `tests/storefront-scope.test.ts` | Modified |
| `tests/vehicle-http-proxy.test.ts` | Modified |

## Limitations and S5.2D Stitch handoff

| Item | Required follow-up |
|---|---|
| Visual design | Supply actual approved Stitch desktop/mobile/tablet screens and assets, including errors/empty states. Current dark visuals intentionally retained. Implement public-only dominant white #FFFFFF / soft gray #F6F6F6 / text #171717 / red #C8102E in S5.2D. |
| Branding | Explicitly settle saved dealer-color precedence before light migration; preserve standalone operator branding, strict tokens, readable foreground/focus and fixed Admin styles. |
| Locked behavior | Keep seven shared navigation labels, twelve ordered sections plus documented FAQ, all six search fields/semantics, banner single-upload geometry/controls, current catalog/detail URLs and CMS management. |
| Assets | Demo artwork is openly fictional and not final photography. Use owned/licensed customer assets later; genuine partner logos/testimonials require authorization. |
| Media | Public bytes remain public by design. R2 network operations/production support not implemented or certified. |
| Scale | Sitemap deliberately caps 1000 entries/type; add bounded sitemap partitioning if inventory/content exceeds those limits. |
| Browser coverage | Functional workflows mainly desktop, with all ten routes checked at three widths and mobile keyboard navigation. Complete interaction combinations, multi-image gallery keyboard acceptance, full accessibility certification and visual comparisons remain for integrated QA/Stitch. |
| Concurrency | No atomic snapshot spanning proxy/render or distributed filesystem/DB transaction is claimed. Existing row ownership/publication defenses and cleanup compensation retained. |
| Commercial infrastructure | Customer DNS/TLS/systemd/backup/restore/permissions/host acceptance not performed. Local QA is not customer deployment or commercial release certification. |
| Next step | Review PR and content/data safety, then authorize S5.2D with actual Stitch reference. No automatic merge, deployment or next-stage work. |
