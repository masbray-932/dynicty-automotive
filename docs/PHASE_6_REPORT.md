# Dynicty Automotive — Phase 6 Report

## 1. Pre-flight state

Repository name matched `dynicty-automotive`; branch `main`; starting local HEAD `cf6b86a2173a4a89a0949f95ae606b2579cc80a3`; worktree clean. Phase 0, 1, 2, 3, 4, and 5 reports all existed with `PASS WITH LIMITATIONS`. Next.js was `16.3.5`, Prisma Client/CLI `6.19.0`, and all Phase 0–5 routes, auth, CRUD, public inventory, detail, settings, logo, and dashboard foundations were present.

Pre-change architecture used 32-byte opaque sessions stored as HMAC digests, bcrypt passwords, Server Action authorization, AVAILABLE-only public queries, route metadata, Vehicle JSON-LD, robots/sitemap, a local/R2 storage boundary, safe user messages, Zod environment validation, dynamic DB-backed rendering, targeted settings revalidation, but no security headers, login limiter, expired-session cleanup, structured logger, or production-grade site URL validation.

## 2. Phase 5 compatibility review

DealerSettings singleton behavior, logo compensation, dashboard metrics, CSS color variables, public presentation fallback, all authenticated actions, and Phase 0–5 business rules were preserved. No business feature or redesign was introduced.

## 3. Files changed

Added centralized URL/header helpers, login limiter, session domain helper, structured logging, runtime environment validation hook, admin metadata layout, structured-data helper, one Prisma migration, Phase 6 tests, and five hardening documents. Updated auth/session/actions, public metadata/routes, sitemap/robots, storage safety, revalidation, image delivery flags, schema, environment example, and architecture/database/storage/phase docs.

## 4. SEO audit summary

Before changes, root metadata used a generic foundation description, Homepage metadata was static rather than DealerSettings-aware, site URL concatenation was duplicated, catalog noindex was broadly correct, detail visibility was correctly AVAILABLE-only, sitemap was unbounded and prerenderable, and admin lacked explicit metadata/header indexing protection. These findings drove the changes below.

## 5. Homepage SEO

Homepage now derives its factual concise title and description from the dealer name with a safe fallback. Canonical and Open Graph URL are `/`; an actual configured logo is used when available. No claims, ratings, or keyword stuffing were added.

## 6. Catalog SEO

Clean `/cars` remains index/follow. Any non-empty query—including malformed or unknown keys—is noindex/follow, and canonical remains `/cars`. This preserves navigation while preventing filter/search/sort/page duplicates from indexing.

## 7. Detail SEO

Metadata uses only the AVAILABLE-only service result. Canonical and Open Graph URL target the exact current slug; ordered primary media is preferred and the placeholder is safe. DRAFT, SOLD, malformed, unknown, and database-error results emit no vehicle facts and are noindex.

## 8. Structured data review

Vehicle JSON-LD was extracted to a tested pure builder and kept deliberately small: factual name, description, images, brand/model/year/transmission/fuel/mileage, and IDR in-stock Offer for an AVAILABLE record. Serialization escapes `<`. No ratings, reviews, finance, warranty, inspection, or certification exists. LocalBusiness/Organization was not added because address components are not structurally reliable.

## 9. Sitemap review

Contains Homepage, `/cars`, and a maximum of 5,000 AVAILABLE cars. It uses reliable car `updatedAt`, excludes all other statuses/routes/query combinations, executes request-time, and safely falls back to the two public static entries on DB failure.

## 10. Robots review

Public routes remain allowed, both `/admin` and `/admin/` are disallowed, the sitemap uses the central origin, and there is no global disallow. Filter behavior stays in metadata.

## 11. Site URL strategy

`lib/site-url.ts` normalizes one origin for metadata base, sitemap, robots, detail, Offer, and WhatsApp context. It removes trailing-slash ambiguity. Development safely falls back to localhost; production startup requires explicit HTTPS.

## 12. Security headers

Next config now returns CSP, `nosniff`, strict-origin referrer policy, restrictive Permissions-Policy, frame denial, same-origin opener policy, hidden framework signature, and production HSTS. Development adds `unsafe-eval` only for tooling. CSP permits current Next inline scripts/styles and was production-built successfully.

## 13. Admin indexing protection

Shared admin metadata sets noindex/nofollow/noarchive/nocache. All `/admin/:path*` responses also receive `X-Robots-Tag: noindex, nofollow, noarchive` and `Cache-Control: private, no-store, max-age=0`.

## 14. Login throttling

A bounded 1,000-key in-memory limiter tracks hashed client and client/email keys. Five failures in 15 minutes block for five minutes; expiry and successful login clear state. Limitation: one-process VPS only and reverse-proxy trust must be configured in Phase 7.

## 15. Login error behavior

Credential failures remain generic. Unknown emails run bcrypt against a process-cached dummy hash. Database/session failures return neutral messages. Email, password, and existence are never logged.

## 16. Session hardening

Tokens remain 256-bit random opaque values; only HMAC-SHA-256 digests persist. Lookup is exact and expiry-checked. Logout deletes the matching row. Session creation failure does not set a successful session.

## 17. Expired session cleanup

Each successful session creation deletes up to 100 expired rows in the same transaction, and lookup best-effort deletes an encountered expired row. The approach is predictable without a scheduler.

## 18. Cookie review

Cookie is HttpOnly, SameSite Lax, Secure in production, path `/`, and has matching seven-day `expires` plus `maxAge`. No Domain is set, preventing unnecessary cross-subdomain sharing.

## 19. CSRF/mutation review

All mutations are Server Actions/POST requests; none use GET. The architecture relies on Next.js Server Action same-origin request checks plus authoritative server validation. No arbitrary mutation redirect input exists.

## 20. Authorization review

Every car, image, brand/model, settings, and logo mutation independently calls `requireAdmin()`. Parent layout authorization remains defense in depth rather than the only check.

## 21. Validation audit

Login, car facts, relationships, price, year, mileage, text, status, brand/model, catalog query, DealerSettings, URL, color, phone/WhatsApp, and identifiers are validated server-side. Catalog page input is newly capped at 1,000.

## 22. Upload hardening

Car limit is 8 MB and logo limit 4 MB. Both accept only JPEG/PNG/WEBP with matching magic signature. SVG/executable content is rejected. Keys are UUID-based, sanitized, relative, and traversal checked. Rejections/failures are logged without filenames or content.

## 23. Next Image/media review

No broad remote pattern exists. Local URLs can use Next optimization; external R2 URLs remain explicitly unoptimized until the exact media hostname exists. Cards/galleries reserve aspect ratio, use responsive sizes, and limit priority to above-fold images.

## 24. Storage hardening

Local and R2 public paths validate keys; filenames cannot control absolute paths. Public URL creation stays centralized inside providers and credentials remain server-only. Storage/DB compensation from Phases 1/5 is preserved. R2 network operations remain deferred to Phase 7.

## 25. Database query review

Homepage, catalog, detail, dashboard, and sitemap selects are bounded and presentation-specific. Card queries take one image. Detail recommendation tiers and dashboard metrics use parallel queries. No clear N+1 query was found.

## 26. Database index review

Existing slug, condition/status, featured/status, brand/model, price/year, image ordering, token digest, and session expiry indexes were reviewed. A real migration adds `(status, updatedAt)` for repeated latest-AVAILABLE and sitemap query patterns; speculative indexes were avoided.

## 27. Pagination review

Catalog remains database skip/take with fixed size 12, bounded page input at 1,000, safe count, and deterministic tie-break sorting. No client-side pagination was introduced.

## 28. Cache/revalidation review

React request cache deduplicates dealer/detail reads. No permanent global data cache was introduced. Car mutations now revalidate Homepage, catalog, affected detail when known, and sitemap; settings keeps targeted consumers. Admin is no-store.

## 29. Dynamic rendering review

Homepage, catalog, detail, sitemap, and DB-backed admin routes intentionally render on request. Sitemap was changed from accidental build-time prerender to request-time. Robots and generic not-found stay static.

## 30. Public error handling

Malformed query input is normalized with clear issues. Unknown inventory uses branded 404/noindex. Database/storage failures return neutral fallback/error states; raw Prisma, filesystem, and stack details remain hidden.

## 31. Admin error handling

Validation errors remain field-specific. Unexpected persistence/storage failures use safe Indonesian messages while logging only event identifiers and non-sensitive IDs/counts where useful.

## 32. Logging implementation

`server/log.ts` provides info/warn/error JSON lines with timestamp, event, and structured primitive context. It is deliberately dependency-free.

## 33. Security event logging

Logs now cover failed/throttled/successful login, logout cleanup, session creation, upload rejection/failure, media cleanup warnings, settings failures, and unexpected public service/database failures.

## 34. Observability readiness

Server services/actions form a clean future Sentry boundary and the existing client error page catches rendering errors. Monitoring/redaction guidance is documented in `OBSERVABILITY.md`; no external account is required.

## 35. Dependency audit

Direct dependencies are small and purposeful; no heavy UI/animation package or clear unused runtime package was found. No major upgrade was attempted during hardening.

## 36. pnpm audit result

`pnpm audit` and `pnpm audit --prod` completed with exit 1: two high advisories for `effect <3.20.0` and `deepmerge-ts <8.0.0`, both transitive through `prisma -> @prisma/config`. Forced nested overrides were rejected as unsafe; a tested Prisma-compatible update is required.

## 37. Environment hardening

Validated keys now include NODE_ENV, DATABASE_URL, SESSION_SECRET, NEXT_PUBLIC_SITE_URL, STORAGE_PROVIDER, and conditional R2 settings. `instrumentation.ts` validates production runtime configuration early.

## 38. Secret validation

Production requires at least 48 non-placeholder SESSION_SECRET characters, HTTPS site URL, non-local storage, and complete R2 configuration. No default production secret is generated.

## 39. Performance/client bundle review

Public content and admin data remain server-rendered. Existing client components are limited to interaction boundaries; no new client dependency or client conversion was introduced.

## 40. Image performance review

Responsive sizes, stable dimensions/aspect ratio, thumbnail sizing, placeholder size, and priority behavior were reviewed. Local media optimization was enabled where the URL is local; remote optimization awaits an exact host.

## 41. Font review

Geist and Geist Mono remain loaded with `next/font`, so no render-blocking external font origin is introduced.

## 42. Accessibility review

Static review covered Homepage, catalog, detail, login, cars, settings, and dashboard: headings, labels, live/status regions, landmarks, keyboard buttons, alt text, and focus-visible styles remain present. External new-tab links were hardened. Browser keyboard and responsive verification remains unclaimed.

## 43. Redirect safety

Existing redirects target fixed internal admin paths. A tested `safeInternalRedirect` helper rejects protocol-relative, external, and backslash paths for future redirect parameters.

## 44. External link safety

All current WhatsApp new-tab links use `rel="noopener noreferrer"`. Dealer-entered social/map URLs remain HTTP/HTTPS validated; current pages do not open them in new tabs.

## 45. WhatsApp safety

Numbers remain normalized to 10–15 digits, fixed `https://wa.me` is used, messages are URL-encoded, and detail URLs come from the centralized production origin.

## 46. CSS/color safety

Only six-digit validated hex strings can reach the two CSS custom properties; arbitrary style strings remain rejected.

## 47. Transaction review

Image primary/reorder stays transactional. Upload/logo replacement remains storage-first with DB-failure compensation. Car/image/logo deletion commits database state then performs idempotent/best-effort object cleanup with an explicit warning/log on failure.

## 48. Tests added

Ten tests were added for URL normalization, redirects, catalog indexing/page bounds, limiter behavior, production headers, invalid/valid production environment, session expiry, factual JSON-LD, and JSON-LD escaping.

## 49. Commands executed

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm db:generate`, `pnpm exec prisma validate`, `pnpm audit`, `pnpm audit --prod`, and `pnpm db:migrate:deploy` were executed. The first Prisma validate lacked DATABASE_URL and was rerun successfully with an explicit non-secret local test URL.

## 50. Lint result

PASS — zero errors and warnings.

## 51. Typecheck result

PASS — zero TypeScript errors.

## 52. Test result

PASS — 10 files and 55 tests.

## 53. Build result

PASS — Next.js 16.3.5 webpack production build completed; all 13 routes compiled, with DB-backed sitemap correctly dynamic.

## 54. Prisma validation result

PASS — Prisma Client generation and schema validation completed on Prisma 6.19.0.

## 55. Migration result

Migration SQL was created and schema-validated. `prisma migrate deploy` was attempted against `127.0.0.1:5432` and failed because no PostgreSQL server is available; applied status is not claimed.

## 56. Database verification result

NOT PERFORMED — PostgreSQL is unavailable. Only generation, schema validation, pure/service-domain tests, and migration SQL review were completed.

## 57. Browser verification result

NOT PERFORMED — no PostgreSQL-backed preview was available. No browser, console, CSP-runtime, mixed-content, keyboard, responsive, or performance claim is made.

## 58. Regression result

Static review, typecheck, 55 tests, and production build passed. AVAILABLE-only public predicates, catalog/filter/sort/pagination, detail/gallery/WhatsApp, admin authorization/CRUD, brands/models/images, settings/logo/dashboard, metadata, sitemap, and robots remain present.

## 59. Known limitations

No live PostgreSQL or browser verification; R2 network adapter incomplete; process-local limiter not horizontally shared; reverse-proxy client-IP trust unverified; exact R2 Image host unknown; two high Prisma configuration-tooling advisories remain.

## 60. Deferred items

R2 implementation, VPS/domain/SSL/proxy, database provisioning/migration/seed, backups, browser QA, real response-header/CSP testing, production monitoring, compatible dependency remediation, and performance measurement are deferred. No Phase 7 deployment work was performed.

## 61. Phase 7 readiness checklist

`PRODUCTION_READINESS.md` contains an entirely unchecked checklist for PostgreSQL, migrations, seed, secrets, site URL, storage/R2, image host, DNS/SSL/proxy, headers, backups, monitoring, advisory resolution, browser QA, smoke tests, and rollback.

## 62. Recommended Phase 7 starting point

Provision PostgreSQL and durable R2 first, complete/test the R2 adapter, configure validated production environment values, apply migrations and seed the administrator, then perform header/CSP and full browser QA before DNS cutover.

## 63. Final Phase 6 status

PASS WITH LIMITATIONS
