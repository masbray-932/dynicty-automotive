# Dynicty Automotive — Stage S4: Standalone customer deployment package

**Verdict: PASS WITH LIMITATIONS.** The package passed local template, PostgreSQL isolation, encrypted backup/restore, Nginx TLS/ingress and production app smoke checks. No customer host was deployed or certified.

| Baseline and review | Evidence |
|---|---|
| Repository and actual main | GitHub and fetched `masbray-932/dynicty-automotive` at `ee3fc73f504c52cb4553bbbd4ecc892055714f8c` (merge of PR #14), matching the expected SHA. |
| Delivery | `feat/automotive-standalone-s4-deployment`; changes confined to a separate worktree. |
| Reviewed | S2/S3 reports, standalone installation contract, existing operational/deployment/storage/security docs and fixed-host templates, startup and environment schema, six Prisma migrations, isolated local storage paths, session/bootstrap rules, and deployment-related tests. |

| Boundary | Package behavior |
|---|---|
| Application and identities | One reviewed release artifact and unprivileged systemd service per customer, with fixed working directory and loopback port. Releases/config/UID/GID/cache/media are separated. Service restarts are bounded, application tree is read-only at runtime except its designated cache and media, and systemd receives the root-only runtime environment outside Git. Operators assign unique IDs, hosts and ports; this is not a provisioning control plane. |
| Configuration and secrets | Renderer accepts validated nonsecret parameters, rejects unsafe inputs and overlapping bases, and refuses to overwrite output. Environment skeleton has placeholders only. Preflight reuses the existing app schema, checks the exact canonical hostname and runtime DB/role identity, excludes admin bootstrap secrets, and verifies the dedicated physical upload target. It does not establish DB connectivity or certify credentials are distinct across customers. |
| PostgreSQL and admin | One database, runtime role and separately controlled migrator/owner per customer. Operator procedure revokes public CONNECT, limits runtime privileges and verifies migration readiness separately from process health. Existing one-primary-admin seed and password rotation/session behavior remain unchanged. |
| HTTPS and media | Reusable customer vhost plus a single default reject fragment. Exact Host/SNI checks, fixed canonical forwarding, peer IP header overwrite, untouched Origin for Next, body size limit and dedicated raster media alias. Proxy reads media without write access by contract; service media stays independent of release pointers. No R2 write support or byte-level authorization claimed. |
| Recovery | Runbooks cover coordinated quiesce, encrypted DB/media/config backup, checksums and retention, restore to empty isolated targets, release pointer switching, and schema/data rollback decision points. Code rollback cannot reverse migrations. |

| Verification | Result |
|---|---|
| Prisma validate and Client generation; Next route type generation, TypeScript and ESLint | **PASS** with the locked dependencies. |
| Regression tests and build | **PASS**: 423 tests in 36 files, including 16 new deployment cases. Production webpack build passed for a synthetic standalone origin. |
| Render and service | **PASS** for two distinct rendered installations and `systemd-analyze --man=no verify`. Executed preflight with correct/mismatched mount; the built production app started on loopback and served liveness and the Alpha database-backed homepage using its restricted role. The host was not running systemd as PID 1; runtime service lifecycle, UID/ACL separation and restart behavior under systemd were not exercised. |
| Real PostgreSQL | **PASS**, native PostgreSQL 17.11 in a disposable loopback cluster. All six migrations applied independently to Alpha and Bravo. Distinct runtime and owner roles and one admin per database were exercised with the existing seed. Both runtime roles were denied cross-database CONNECT, schema creation and access to migration metadata. |
| Backup and restore | **PASS**, `pg_dump`/`pg_restore` 17.11 and age 1.2.1. Encrypted the disposable DB/media/config/runtime-env bundle, decrypted it with an ephemeral recovery key, verified all four SHA-256 digests, and restored with `pg_restore --exit-on-error --single-transaction` into a third empty database. Verified Alpha settings, admin, six migration records, and exact Alpha media bytes; Bravo media was different. No live targets. |
| HTTPS and ingress | **PASS locally**, Nginx 1.26.3 syntax and live loopback HTTPS with disposable self-signed certificates trusted only by the test and two echo upstreams. Verified 308, unknown Host and SNI rejection, mismatched SNI/Host rejection, fixed forwarding/peer IP with Origin preservation, 413, media MIME/nosniff, non-image/symlink/method denial, separate roots, and persistent media after a release-pointer switch. Next was smoke-tested separately; this does not certify a public chain, DNS, network firewall or end-to-end customer traffic. |
| Customer infrastructure and browser | **NOT VERIFIED**. Required before release: actual host systemd and UID/ACL verification, private-port firewall, HTTPS chain and proxy/origin checks, DB transport/backup destination and access controls, recovery drill at customer scale, and interactive desktop/mobile Admin, storefront, branding, CMS and media QA. |

| Files created or changed | Purpose |
|---|---|
| `deploy/standalone/render.mjs`, `deploy/standalone/preflight.mjs` | Nonsecret renderer and fail-closed runtime preflight. |
| `deploy/standalone/automotive.service.in`, `site.nginx.in`, `default-reject.nginx`, `runtime.env.in` (same directory) | Service, HTTPS ingress, unknown-host defaults and secret placeholders. |
| `docs/AUTOMOTIVE_STANDALONE_INSTALLATION.md` | Install/configuration, isolation, database, bootstrap and startup procedures. |
| `docs/AUTOMOTIVE_STANDALONE_DEPLOYMENT_CHECKLIST.md`, `docs/AUTOMOTIVE_STANDALONE_BACKUP_RESTORE.md`, `docs/AUTOMOTIVE_STANDALONE_UPGRADE_ROLLBACK.md` | Checklist and operations runbooks. |
| `tests/standalone-deployment.test.ts`, `docs/AUTOMOTIVE_STANDALONE_S4_IMPLEMENTATION_REPORT.md` | Regression checks and verification evidence. |

No application feature code, authentication, schema, migration or multi-dealer foundation changed. No live customer data, production/staging infrastructure, DNS, public certificates, or deployment touched.
