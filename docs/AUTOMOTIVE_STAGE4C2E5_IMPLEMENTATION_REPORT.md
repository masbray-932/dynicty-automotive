# Dynicty Automotive — Stage 4C.2E.5: Public storefront scoped integration

**Verdict: PASS WITH LIMITATIONS.** The existing public routes now qualify inventory ownership. Registered-dealer storefronts and media remain disabled. PostgreSQL-backed and deployed ingress verification remain activation gates.

| Baseline | Evidence |
|---|---|
| Repository and HEAD | GitHub `masbray-932/dynicty-automotive` `main` and fetched commit `69dfc7cff84d67bf16822e45bd831e16bb5835c2`, merge of PR #11. Work was isolated from the pre-existing checkout. |
| Reviewed | 4C.2D architecture audit; 4C.2E.1–4C.2E.4 reports; Prisma schema and ownership FKs; dealer registry, hostname normalization, scope and inventory DAL; public services and routes; storage URL providers and key conventions; Next metadata/cache, existing revalidation paths, routing and Nginx examples; regression tests. |
| Ingress evidence | Nginx examples use fixed legacy vhosts and forward `Host $host`; forwarded IP settings are not dealer identity verification. No active multi-dealer ingress contract or trusted request issuer was verified. No app middleware/proxy for dealer routing was present. |

| Surface | Integration |
|---|---|
| Server-only context | Existing routes explicitly pass the legacy inventory capability. Unknown/invalid/revoked resolution yields no context; raw input, copied capabilities, and missing input are untrusted. An actual registry-issued registered capability is distinguished from those cases but still denied at every storefront entry. Routes do not attempt domain resolution or use headers, query parameters, or cookies to select a dealer. Existing HTTP hostname acceptance remains a deployment responsibility. |
| Homepage | Featured/latest cars, brand/model choices, available counts and cover projections qualify NULL ownership and AVAILABLE inventory. Nested brand and model relationships also qualify ownership. Card layout, selection ordering, and dealer presentation are retained. |
| Catalog | The ownership predicate is ANDed with the existing filters so search OR clauses and slug selectors cannot replace it. Count and paged rows share that predicate. Brand/model/transmission options are scoped. Existing parsing, invalid-combination behavior, URL parameters, ordering, and pagination remain unchanged. |
| Detail and related inventory | Detail slug lookup and each related-car branch require legacy ownership and AVAILABLE status. The page and metadata use the same scoped result; absent or foreign detail has no indexable metadata. Existing internal registered DAL ID/slug reads stay unwired. |
| Gallery and cover | Projections require NULL image ownership under a scoped vehicle. Only keys under that vehicle's existing `cars/<car-id>/` namespace with a safe filename are passed to storage; malformed/mismatched rows cannot produce image URLs. Raw keys are not returned. This protects emitted URLs, not direct access to legacy public storage. No registered media URL delivery is enabled. |
| Sitemap and canonical | Sitemap entries come from scoped AVAILABLE inventory. The sitemap base is the configured legacy site URL through a legacy-only gate. Existing relative metadata, root metadataBase and legacy canonical/structured data behavior remain; no canonical origin comes from the request and no registered sitemap is emitted. |
| Cache isolation | React request-local slug memoization is private to legacy detail and remains useful between metadata and page rendering. Capability validation precedes cache lookup, and no registered storefront or metadata cache is introduced. Existing legacy dealer presentation cache and path revalidation are unchanged. |

| Remaining activation gate | Required evidence |
|---|---|
| Ingress, domain lifecycle and canonical host | Verify a trusted ingress and direct-access rejection, strict unknown-host behavior at ingress, exact host binding and version, canonical revalidation, revocation and fail-closed routing. A registry result is a public selector only. |
| Registered storefront data | Integrate the registered DAL with the public presentation and taxonomy/search contracts after ingress is ready. Scope dealer settings and CMS as well as inventory. Verify foreign and NULL exclusion with disposable PostgreSQL, including nested reads, reassignment races and binding revocation. Never backfill while unscoped consumers remain live. |
| Media delivery | Establish asset provenance, dealer-scoped object keys and serving/access rules (including direct local/static and provider paths), cache purge and coordinated cleanup. Row filtering and the legacy key check do not enforce asset-byte access. |
| Metadata and caching | Validate per-dealer canonical origin, sitemap, robots, metadata and structured data. Initially avoid shared caching; a future cache and invalidation strategy must key by trusted dealer, binding ID/version, canonical version, and route/query inputs. Test with two dealers, host spoofing and revoked bindings before activation. |

| Validation | Result |
|---|---|
| Prisma validate / Client generation | PASS, Prisma 6.19.0 using a nonresolving synthetic database URL. |
| ESLint, route type generation, TypeScript | PASS. |
| Vitest | PASS: 385 tests in 33 files, including 13 new storefront tests. Covers homepage regression, catalog filters and paging, foreign detail and gallery denial, sitemap/canonical boundaries, forged contexts, invalid/revoked bindings, and memoization bypass denial. |
| Production build | PASS, Next.js 16.3.5 webpack with synthetic staging configuration and a nonresolving database URL. |
| PostgreSQL-backed browser, storage and ingress | NOT VERIFIED. No disposable PostgreSQL target or runtime was available. Tests use mocked Prisma/storage and a memoization double, not PostgreSQL transactions, real browser rendering, deployed ingress or asset-byte authorization. |

| Changed files | Purpose |
|---|---|
| `server/storefront/{context,inventory,media}.ts` | Fail-closed storefront gate, shared ownership predicates and legacy media URL boundary. |
| `server/{homepage,catalog,car-detail}/service.ts` | Scoped public projections, catalog predicates, detail/related reads and sitemap entries. |
| `app/(public)/page.tsx`, `app/(public)/cars/page.tsx`, `app/(public)/cars/[slug]/page.tsx`, `app/sitemap.ts` | Explicit legacy scope selection without changes to paths or layout. |
| `services/storage/key.ts` | Validate legacy car image namespace without changing key creation or Admin writes. |
| `tests/storefront-scope.test.ts`, `tests/content-pages.test.tsx` | Service/route regression and scoped security checks; extend the page fixture for the server-only dependency. |
| `docs/AUTOMOTIVE_STAGE4C2E5_IMPLEMENTATION_REPORT.md` | Scope, verification and activation blockers. |

No schema, migration, Admin CRUD, auth, DB, DNS, Nginx, systemd, VPS or live configuration was changed. No dealer or membership was created or activated.
