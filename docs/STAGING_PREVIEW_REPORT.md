# Dynicty Automotive Staging Preview Report

Report date: 2026-09-15.

## 1. Pre-flight state

- Repository: `dynicty-automotive` (matched required repository).
- Branch: `main`.
- HEAD: `cf6b86a2173a4a89a0949f95ae606b2579cc80a3`.
- Worktree: dirty; Phase 6, Phase 7, and staging changes are uncommitted.
- Phase 6/7 foundation: present in the worktree, including hardening, health route, deployment examples, production docs, and reports.
- Deployment decision: no deployment was attempted from the unknown dirty tree.
- Migrations present: Phase 0 foundation, Phase 1 primary-image constraint, and Phase 6 query hardening.
- R2: interface/public URL boundary present; network `put` and `delete` remain deliberately incomplete.
- Environment validation: includes database, strong session secret, centralized site URL, storage selection, R2 conditionals, trusted proxy, and now explicit staging mode/local-storage opt-in.
- Existing deployment docs: Phase 7 production deployment/readiness/QA documentation existed before this staging task.

## 2. Deployed commit

NOT DEPLOYED. The recorded HEAD predates the uncommitted Phase 6/7/staging work, so it is not a valid staging release. A reviewed commit must be created and its exact hash deployed.

## 3. Production isolation verification

`automotive.dynicty.com` was not modified. No production DNS, database, media, environment, Nginx block, certificate, or service was accessed. Staging behavior is explicitly gated by `DEPLOYMENT_ENV=staging`, and the staging template uses a separate hostname/database/storage contract.

## 4. Infrastructure availability

| Dependency | Availability | Evidence |
| --- | --- | --- |
| VPS shell | UNAVAILABLE | No authenticated host/SSH target was supplied. |
| PostgreSQL staging | UNAVAILABLE | No `DATABASE_URL`, endpoint, credentials, `psql`, or `pg_isready`. |
| Cloudflare/DNS | UNAVAILABLE | No connector/account access or zone authorization. |
| Cloudflare R2 | UNAVAILABLE | No account, bucket, credentials, or exact media host. |
| Nginx | UNAVAILABLE | Binary absent locally; no VPS access. |
| SSL/certificate | UNAVAILABLE | No origin or certificate access. |
| systemd | PARTIAL | Binary exists locally, but this workspace is not the target VPS and no service was installed. |
| Local production runtime | AVAILABLE | Built application ran on loopback for source-level runtime checks. |
| Browser/public preview | UNAVAILABLE | Public hostname request timed out through the available network proxy; no DB-backed preview runtime existed. |

## 5. Staging hostname

Configured target is `automotive-preview.dynicty.com`. Application URL generation uses the centralized `NEXT_PUBLIC_SITE_URL`; the staging build used `https://automotive-preview.dynicty.com`. Public routing was not changed or verified.

## 6. Database status

BLOCKED. A dedicated `dynicty_automotive_staging` database and least-privilege application role are documented but were not created. No production/shared database was accessed.

## 7. Migration status

BLOCKED for runtime deployment. `pnpm db:generate` and `pnpm exec prisma validate` passed, but `pnpm db:migrate:deploy` was not run because no isolated staging PostgreSQL database existed. No `db push`, reset, or destructive command was used.

## 8. Admin seed status

PREPARED, NOT EXECUTED. `prisma/seed-staging.ts` requires explicit staging mode, rejects a database name without `staging`, accepts temporary operator credentials, hashes the password with bcrypt, and does not print it.

## 9. DealerSettings status

PREPARED, NOT EXECUTED. The idempotent staging seed upserts the singleton ID `default` with clearly preview-labelled, non-sensitive settings. Runtime propagation was not tested without a database.

## 10. Test inventory status

PREPARED, NOT EXECUTED. The seed defines a small realistic catalog with AVAILABLE NEW/USED, FEATURED, DRAFT, SOLD, multiple brands/models, varied transmissions, prices and years, plus enough public records to exercise pagination. It does not delete/reset data.

## 11. Storage strategy

Preferred strategy is a dedicated staging R2 bucket/prefix and staging-only credential. An isolated local-storage fallback is explicitly permitted only for `DEPLOYMENT_ENV=staging` with `ALLOW_STAGING_LOCAL_STORAGE=true`, under the dedicated staging deployment path.

## 12. R2/local media status

BLOCKED for runtime verification. No R2 credentials/bucket/media hostname existed. Local production-mode staging configuration passed environment validation/build, but no persistent staging upload path was provisioned and no test media was written or committed.

## 13. Build result

PASS. `pnpm install --frozen-lockfile`, Prisma generation, lint, typecheck, tests, schema validation, and the Next.js production build all succeeded with staging configuration.

## 14. Service status

BLOCKED. A non-root systemd example is prepared as `deploy/systemd/dynicty-automotive-preview.service.example`; no VPS service was installed, enabled, restarted, or inspected.

## 15. Local port

Prepared deployment port: `127.0.0.1:3101`. Disposable verification used `127.0.0.1:3111` to avoid assuming port availability and was stopped after testing. No raw port was publicly exposed.

## 16. Nginx status

BLOCKED for runtime. A host-specific example exists at `deploy/nginx/automotive-preview.dynicty.com.conf.example`. It redirects HTTP, proxies only the preview hostname, overwrites forwarded client IP headers, supports upgrade connections, and adds defense-in-depth noindex. `nginx -t` could not be run because Nginx/VPS access was unavailable.

## 17. DNS status

BLOCKED. No staging DNS record was created or changed. The production record was not touched.

## 18. SSL status

BLOCKED. Wildcard/hostname certificate coverage and origin installation were not verifiable. The Nginx example intentionally uses operator-replaced certificate paths.

## 19. HTTPS status

BLOCKED for the public hostname. `NEXT_PUBLIC_SITE_URL` is correctly HTTPS and the prepared Nginx config redirects HTTP to HTTPS, but no public handshake or redirect chain was verified.

## 20. Health check

PASS locally. The production build returned HTTP 200 and only `{"status":"ok"}` from `/healthz`. Public `https://automotive-preview.dynicty.com/healthz` was not verified.

## 21. Trusted proxy status

PREPARED, runtime BLOCKED. The service is designed to bind to loopback and Nginx overwrites `X-Real-IP`/`X-Forwarded-For` using its observed remote address. If Cloudflare is enabled, operator must trust only published Cloudflare ranges and restore `CF-Connecting-IP`; limiter IP behavior remains unverified until tested through the actual proxy chain.

## 22. Admin login result

NOT TESTED. No migrated staging DB or staging admin account existed. Existing generic-error/session/authorization tests passed, but that is not a live login claim.

## 23. Dashboard result

NOT TESTED. Seeded counts/recent vehicles require a migrated staging DB and authenticated browser session.

## 24. CRUD result

NOT TESTED. Brand/model and car create/edit/status/featured/delete flows require staging-only runtime data. No production or shared records were modified.

## 25. Image result

BLOCKED. No isolated storage runtime existed, so upload, multi-image, primary selection, reorder, deletion, and logo operations were not exercised.

## 26. DealerSettings result

NOT TESTED at runtime. Validation/mutation hardening tests pass and a preview-safe seed is prepared; public propagation still requires staging infrastructure.

## 27. Homepage result

PARTIAL LOCAL VERIFICATION ONLY. The route rendered in the production runtime, canonicalized to the preview hostname, and safely logged unavailable-DB errors without exposing details. Real sections/data/branding were not browser-tested.

## 28. Catalog result

NOT TESTED. Filters, sorting, pagination, reset, malformed combinations, and AVAILABLE-only behavior require the seeded staging database.

## 29. Detail result

NOT TESTED. Gallery/specs/mileage/related/breadcrumb/contact and DRAFT/SOLD/unknown 404 rules require seeded records and browser runtime.

## 30. WhatsApp result

NOT TESTED. URL helper/security tests passed, but a real staging CTA with test settings, price, title, and preview detail URL was not inspected.

## 31. Global staging noindex result

PASS locally. `/`, `/healthz`, and `/robots.txt` returned `X-Robots-Tag: noindex, nofollow, noarchive` and `Cache-Control: private, no-store, max-age=0`. The behavior is gated by explicit staging deployment mode and does not change production defaults.

## 32. Robots result

PASS locally. Staging `/robots.txt` returned `User-Agent: *` and `Disallow: /` with no sitemap reference. Public behavior remains BLOCKED until deployment.

## 33. Security headers

PASS locally for CSP, `nosniff`, Referrer-Policy, Permissions-Policy, frame protection, Cross-Origin-Opener-Policy, HSTS, staging noindex, and staging no-store. Nginx/Cloudflare live response verification is BLOCKED.

## 34. Responsive QA

NOT TESTED. No browser-accessible DB-backed staging runtime was available for 390/768/1280 pixel checks.

## 35. Console QA

NOT TESTED in a browser. The local server emitted structured, secret-free database-unavailable events as expected because the placeholder database was intentionally unreachable; no claim is made for hydration, asset, CSP, mixed-content, or Server Action behavior.

## 36. Session cookie QA

NOT TESTED on HTTPS staging. Source configuration requires HttpOnly, Secure in production mode, SameSite, host-only scope, expiration, and server-side digest storage, but live cookie inspection requires a successful staging login.

## 37. DB isolation result

PASS for non-access and configuration safeguards; runtime provisioning is BLOCKED. No database operation was performed. The template names a separate staging DB and the staging seed rejects non-staging database names.

## 38. Storage isolation result

PASS for configuration safeguards; runtime provisioning is BLOCKED. The documented paths/bucket contract are staging-specific, and no production media access or mutation occurred.

## 39. Performance smoke result

PARTIAL. Production compilation and local startup succeeded quickly, and route generation completed without build errors. Real page navigation, queries, layout shift, and image loading were not tested without DB/media/browser infrastructure; no Lighthouse score is claimed.

## 40. Lint result

PASS — `pnpm lint`.

## 41. Typecheck result

PASS — `pnpm typecheck`.

## 42. Tests result

PASS — 10 test files and 58 tests. New coverage includes explicit staging detection and the guarded staging local-storage exception.

## 43. Build result

PASS — `pnpm build` completed with Next.js 16.3.5 using production-mode staging variables.

## 44. Known limitations

- Phase 6/7/staging source is uncommitted and therefore not a deployable reviewed release.
- PostgreSQL, migration deploy, seed, R2/local persistent storage, VPS, systemd, Nginx, DNS, SSL, trusted proxy, public headers, cookies, and browser flows were not available for end-to-end verification.
- R2 upload/delete network operations remain incomplete.
- The local Homepage used a deliberately unreachable placeholder DB, so only graceful failure/header/canonical behavior was observed.

## 45. Remaining blockers

1. Review and commit the complete Phase 6/7/staging work.
2. Provision a dedicated staging PostgreSQL database/role and isolated media storage.
3. Install real staging secrets/environment outside Git.
4. Deploy the reviewed commit, migrate, seed, build, and start the preview service.
5. Validate Nginx and trusted client-IP behavior, then configure only preview DNS and TLS.
6. Perform live public/admin, media, SEO, security-header, responsive, console, cookie, and performance QA.

## 46. Exact preview URL

`https://automotive-preview.dynicty.com`

The URL is the configured target, not a claim that the application is currently live there.

## 47. Recommended next step

Review the dirty Phase 6/7/staging diff and create a known release commit. Then follow `docs/STAGING_DEPLOYMENT.md` starting with the isolated PostgreSQL and environment gates; do not create DNS until local service, migration, admin login, and critical flows pass.

## 48. Final staging status

READY FOR MANUAL DEPLOYMENT
