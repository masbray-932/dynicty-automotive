# Dynicty Automotive Staging QA Matrix

Status date: 2026-09-15. `PASS` means the item was actually verified in the stated local environment. `BLOCKED` means required staging infrastructure/access was unavailable. `NOT TESTED` means a runnable staging service or browser workflow was not available. No local source/build result is treated as proof that the public preview is live.

## Infrastructure

| Item | Status | Evidence / required action |
| --- | --- | --- |
| Known reviewed deployment commit | BLOCKED | Phase 6/7 and staging changes remain uncommitted; deployment from the dirty tree was prohibited. |
| Frozen dependency install | PASS | `pnpm install --frozen-lockfile` completed successfully. |
| Prisma generation | PASS | Prisma Client 6.19.0 generated successfully. |
| Prisma schema validation | PASS | Validated with a disposable staging-format PostgreSQL URL; no DB connection was claimed. |
| Production-mode staging build | PASS | Next.js 16.3.5 optimized build completed with staging environment validation. |
| Local production runtime | PASS | Built app started on `127.0.0.1:3111` for disposable local verification only. |
| Health endpoint | PASS | Local `/healthz` returned HTTP 200 and `{"status":"ok"}`. |
| Dedicated PostgreSQL database | BLOCKED | No PostgreSQL endpoint, credentials, or client tooling available. |
| Migration deploy | BLOCKED | No staging database; prepared command is `pnpm db:migrate:deploy`. |
| Migration drift/index verification | BLOCKED | Requires staging PostgreSQL catalog access. |
| Staging seed | BLOCKED | Safe idempotent seed is prepared, but was not run without an isolated database. |
| Storage runtime | BLOCKED | Local/R2 production-like storage was not provisioned; R2 network operations remain incomplete. |
| Storage isolation | BLOCKED | Configuration contract is prepared; no bucket/path runtime exists to inspect. |
| VPS deployment path | BLOCKED | No VPS shell target or authentication was supplied. |
| systemd service | BLOCKED | Dedicated example is prepared; systemd service was not installed or started. |
| Nginx server block | BLOCKED | Dedicated example is prepared; Nginx was unavailable locally and no VPS access exists. |
| Trusted proxy/client IP | BLOCKED | Header-overwriting config is prepared; behavior behind the target Nginx/Cloudflare path was not verified. |
| Staging DNS | BLOCKED | No DNS/Cloudflare access; no record was changed. |
| Origin TLS certificate | BLOCKED | No certificate/VPS access to verify wildcard coverage or install a certificate. |
| Public HTTPS hostname | BLOCKED | Direct request timed out through the available network proxy; public application reachability was not established. |
| Live security headers | BLOCKED | Header set passed local runtime inspection only, not the public Nginx/Cloudflare path. |

## Public application

| Item | Status | Evidence / required action |
| --- | --- | --- |
| Homepage | NOT TESTED | Local fallback rendering was reachable, but no staging DB/test data existed for functional QA. |
| Catalog | NOT TESTED | Requires migrated staging DB and seeded inventory. |
| Filters | NOT TESTED | Requires browser QA against seeded staging data. |
| Car detail | NOT TESTED | Requires AVAILABLE seeded record and browser runtime. |
| Gallery | NOT TESTED | Requires isolated media storage and test uploads. |
| WhatsApp CTA | NOT TESTED | Requires seeded settings/car and verification that preview URL is embedded. |
| DRAFT/SOLD exclusion | NOT TESTED | Source tests exist from hardening, but staging DB behavior was not exercised. |
| 404 behavior | NOT TESTED | Requires full staging runtime/browser QA. |
| Responsive 390/768/1280 | NOT TESTED | No browser-accessible DB-backed staging application. |
| Browser console/CSP | NOT TESTED | No public staging browser session was available. |
| Performance smoke | NOT TESTED | Build passed; real navigation/image/query behavior needs deployed staging. |

## Admin application

| Item | Status | Evidence / required action |
| --- | --- | --- |
| Login form | NOT TESTED | No migrated staging DB/admin account. |
| Invalid login response | NOT TESTED | Limiter/error unit coverage exists, but no staging login runtime. |
| Valid staging login | BLOCKED | Staging admin seed was not executed without an isolated DB. |
| Login limiter | NOT TESTED | Needs cautious live testing through the actual trusted proxy. |
| Session cookie | NOT TESTED | Requires HTTPS staging login and browser cookie inspection. |
| Dashboard | NOT TESTED | Requires seeded DB and authenticated browser session. |
| Brand management | NOT TESTED | Requires staging-only CRUD runtime. |
| Model management | NOT TESTED | Requires staging-only CRUD runtime. |
| Create car | NOT TESTED | Requires staging-only CRUD runtime. |
| Edit/status/featured car | NOT TESTED | Requires staging-only CRUD runtime. |
| Delete car | NOT TESTED | Requires staging-only disposable test record. |
| Image upload/reorder/primary/delete | BLOCKED | No isolated staging storage is available. |
| DealerSettings | NOT TESTED | Seed is prepared; public propagation needs DB-backed runtime. |
| Logo management | BLOCKED | No isolated staging storage is available. |
| Logout/session invalidation | NOT TESTED | Requires valid staging login. |

## SEO and staging isolation

| Item | Status | Evidence / required action |
| --- | --- | --- |
| Global staging noindex | PASS | Local production runtime returned `X-Robots-Tag: noindex, nofollow, noarchive` on `/`, `/healthz`, and `/robots.txt`. |
| Global staging no-store | PASS | Local staging responses returned `Cache-Control: private, no-store, max-age=0`. |
| Staging robots policy | PASS | Local `/robots.txt` returned `User-Agent: *` and `Disallow: /`, with no sitemap. |
| Preview canonical | PASS | Local Homepage output used `https://automotive-preview.dynicty.com`. |
| Production SEO isolation | PASS | Staging behavior is gated by explicit `DEPLOYMENT_ENV=staging`; automated tests cover explicit staging detection. No production hostname/config was changed. |
| Admin noindex | PASS | Existing Phase 6 admin protection remains in source; global staging header is additional defense. |
| Live public noindex/robots | BLOCKED | Must be rechecked through public Nginx/Cloudflare after deployment. |

## Repository checks

| Check | Status | Result |
| --- | --- | --- |
| Lint | PASS | `pnpm lint` completed successfully. |
| Typecheck | PASS | `pnpm typecheck` completed successfully. |
| Tests | PASS | 10 test files, 58 tests passed. |
| Build | PASS | Production-mode staging build completed successfully. |
| Git diff integrity | PASS | `git diff --check` returned no whitespace errors. |
| Secret/media hygiene | PASS | Scan found only documented placeholders/development examples; no real secrets or uploaded media were added. |

## Production safety

| Gate | Status | Evidence |
| --- | --- | --- |
| `automotive.dynicty.com` unchanged | PASS | No DNS, host, Nginx, service, or runtime access was used; staging code is environment-gated. |
| Production database unchanged | PASS | No database credentials/access existed; no DB command was executed. |
| Production media unchanged | PASS | No R2/local production storage access existed and no upload/delete was attempted. |
| Production secrets not reused/committed | PASS | Only placeholder templates were added; disposable local validation values were not written to repository files. |
| Unrelated Dynicty services unchanged | PASS | No VPS/systemd/Nginx access or mutations occurred. |
