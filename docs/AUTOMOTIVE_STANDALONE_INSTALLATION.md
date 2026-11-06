# Automotive standalone installation contract

A standalone installation is one customer, one application and service identity, one dealer, one primary admin, one PostgreSQL database, one media root and one public HTTPS origin. No Dynicty service, subscription, registry row, hostname resolver or tenant provisioning is required. Keep the existing nullable ownership schema and every migration. The legacy dealer uses `DealerSettings.id = 'default'` with `dealerId IS NULL`; CMS uses that settings row. Inventory ownership is NULL, including its brand, model and image relationships. Do not create a Dealer row for the installation or assign ownership as a migration step.

| Area | Operator requirements |
|---|---|
| PostgreSQL | Provision a dedicated database and credentials, with no access to other customer databases. Use the repository migration workflow (`pnpm db:generate`, `pnpm db:migrate:deploy`, then `pnpm exec prisma migrate status`). Take a backup before upgrade. Never use reset or automatic drift repair on an existing install. |
| Runtime | Use a supported Node release for the locked Next.js package, install with `pnpm install --frozen-lockfile`, run validation and `pnpm build`, then bind `pnpm start --hostname 127.0.0.1` (or equivalent private service binding) behind the installation's HTTPS ingress. Use a fixed application working directory, an unprivileged dedicated service account, and a secret environment file outside Git. |
| Environment | `NODE_ENV=production`, `DEPLOYMENT_ENV=production`, dedicated `DATABASE_URL`, unique random `SESSION_SECRET` (generate e.g. with `openssl rand -hex 32`), `NEXT_PUBLIC_SITE_URL=https://<customer-host>`, `STORAGE_PROVIDER=local`, `ALLOW_STANDALONE_LOCAL_STORAGE=true`, and `TRUST_PROXY=true` only with the topology below. Set the same canonical origin for build and runtime. Startup rejects an invalid production origin, weak session secret, and local production storage without explicit opt-in. The flag does not verify mounts, ingress or physical isolation. |
| Media | Put a dedicated durable volume/directory behind this installation's `public/uploads` path; keep it outside the versioned release and link/mount it consistently in each release. The service can write, the proxy can only read, and no other installation can read/write the private filesystem or share the root. Do not allow child symlinks or executable uploads. Serve `/uploads/` directly via the installation's fixed proxy file root for new uploads without an app restart. Verify an upload becomes publicly reachable and a delete removes it. Existing relative key names and URLs remain unchanged. R2 URL configuration is still accepted for existing deployments, but the adapter has no upload/delete implementation; do not select it for a writable standalone release. |
| HTTPS and ingress | Allowlist exactly the configured hostname in the TLS and HTTP virtual hosts. Reject unmatched hosts in a default vhost, including attempts to access the upstream directly. Forward only the configured host and overwrite/strip client forwarding headers; in particular overwrite `X-Real-IP` and `X-Forwarded-For` with the trusted client address. Terminate HTTPS at ingress, keep the application port private, and test redirects, host mismatch, origin/Server Action protection and Admin cookie behavior. Do not configure wildcard routing to the standalone app. |
| Primary Admin | In a restricted operator shell, set temporary `ADMIN_EMAIL` and `ADMIN_PASSWORD`, run `pnpm db:seed`, then unset them. The normal seed initializes settings and one admin without demo vehicles/taxonomy. The staging-only demo seed uses the same account policy. Matching email/password is a no-op; the same email with a new password rotates its hash and deletes its current DB sessions. Keep login traffic paused during password rotation if immediate revocation is required. Different email or multiple existing accounts causes the seed to refuse; it does not automatically delete or disable existing accounts. Reconcile accounts with a backup before standalone onboarding. There is no Admin account-creation UI/API, and direct PostgreSQL writes bypass this policy. |
| Settings/branding | In Admin → Pengaturan Dealer, update the showroom profile and use the separate Branding Dealer forms to set primary color, secondary focus color, or upload/remove a logo. Colors accept only six-digit hex and blank resets to defaults. Static JPEG, PNG and WebP logos are validated and re-encoded as WebP. The standalone permission and writes are restricted to the unowned legacy settings row; platform permissions and registered-dealer settings remain protected. |
| Backup and restore | Back up PostgreSQL with `pg_dump` and media with an independent durable snapshot under one recovery point; quiesce writes if consistency across both is required. Retain encrypted off-instance copies. Restore database and media into an isolated installation and validate row counts, public URLs, key format and login before switching traffic. Keep secret recovery and credential rotation documented separately from dumps. |
| Upgrade and rollback | Validate the locked build and deploy migrations to a disposable restore first. Snapshot data and media, retain the prior app artifact, and verify login, CRUD, gallery and SEO after switching. Roll back code only if the old release is safe against the current schema and data; otherwise restore a coordinated recovery point. Never run a previous release with unscoped Admin readers against a database containing registered inventory. |

Public media files are intentionally public; the row and key checks do not authorize direct access to file bytes. In particular, do not use this public directory for confidential assets. Check existing image rows for legacy key compatibility before adopting imported inventories. For deployment, confirm the real data does not contain additional admins or registered inventory, confirm direct media reads and backups, and complete browser QA for onboarding, login, editing, upload/delete, and mobile display.

Canonical URLs always use deployment configuration. Host headers do not select inventory; the application alone is not a hostname allowlist. On the previous merge, Next.js 16.3.5 streamed the not-found UI with `noindex` and no vehicle data but with HTTP 200 when the status had already been sent. The exclusion is still meaningful for visibility and indexing. Synthetic monitoring should verify the not-found/robots behavior, not just status. If a downstream integration mandates HTTP 404, design and verify a non-streaming existence check before any bytes are sent; do not rewrite all 200 responses or infer status from body fragments at ingress.

## S4 deployment package

Use [the customer deployment checklist](./AUTOMOTIVE_STANDALONE_DEPLOYMENT_CHECKLIST.md), [backup and restore](./AUTOMOTIVE_STANDALONE_BACKUP_RESTORE.md), and [upgrade and rollback](./AUTOMOTIVE_STANDALONE_UPGRADE_ROLLBACK.md). The original Dynicty-specific templates are not used by this package.

```sh
node deploy/standalone/render.mjs --id acme --hostname cars.acme.example --port 3107 \
  --node-bin /usr/bin/node --tls-cert /etc/tls/acme/fullchain.pem \
  --tls-key /etc/tls/acme/privkey.pem --output ./acme-config
```

Run from a reviewed checkout using Node 24 as tested by S4, the locked pnpm version, PostgreSQL with compatible client tools, systemd and Nginx with `ssl_reject_handshake` support. The renderer validates input and writes only to a new directory. It installs nothing and does not accept or generate secrets. Replace the Node path and TLS files with installed paths. Optional `--release-base`, `--state-base`, and `--config-base` change the default disjoint bases shown below.

| Allocation | Customer A | Customer B |
|---|---|---|
| Example ID / host / private port | `acme` / `cars.acme.example` / 3107 | `bravo` / `cars.bravo.example` / 3108 |
| Service / Unix user and group | `automotive-acme.service` / `auto-acme` | `automotive-bravo.service` / `auto-bravo` |
| App DB / runtime login | `auto_acme` / `auto_acme` | `auto_bravo` / `auto_bravo` |
| App root, release pointer | `/srv/automotive/acme/current` | `/srv/automotive/bravo/current` |
| Persistent media | `/var/lib/automotive/acme/uploads` | `/var/lib/automotive/bravo/uploads` |
| Runtime environment | `/etc/automotive/acme/runtime.env` | `/etc/automotive/bravo/runtime.env` |

The operator must reserve unique IDs, hostnames and private ports; no registry or provisioning service checks other installations. Use unique database and admin passwords, session secrets and independent encrypted backup destinations. Customer services must have distinct Unix UIDs/groups; no supplementary group grants across customers. Root, the host database administrator and the Nginx worker are trusted infrastructure: the worker may read each customer's **public** upload root via narrowly scoped ACLs and cannot write them. This is process/data isolation, not isolation from the host operator.

### Filesystem and service

Create the generated unprivileged user/group as a system identity with no login shell. Keep the app tree and pointer operator-owned and readable/traversable by that customer's group only; deployed application source, dependencies and service definitions must not be writable by the runtime user. Build in a separate workspace, copy a complete release (including `.next`, dependencies and deployment scripts), and make a fresh writable `.next/cache` for each release. Set the release working directory in the generated service to `current` and link that release's `public/uploads` to the **physical** persistent upload directory. The upload directory belongs to the service identity, with only that service able to write. Use the matching customer group on its private parent. Keep the Node executable at a system path accessible with `ProtectHome=true`. Give the actual Nginx worker traverse-only access to private parents and read/traverse on uploads, including defaults for newly created files; never add customer services to each other's groups. Example for a Debian worker named `www-data` (run as the host operator, after creating isolated directories):

```sh
chmod 0710 /var/lib/automotive/acme
chmod 0750 /var/lib/automotive/acme/uploads
setfacl -m u:www-data:--x /var/lib/automotive/acme
setfacl -m u:www-data:r-x,d:u:www-data:r-x /var/lib/automotive/acme/uploads
# For restored/existing files, apply worker read-only access to files and
# read/traverse to directories separately; reapply defaults on existing subdirectories.
```

The service reads a root-owned `0600` environment file outside Git through systemd. Do not shell-source a systemd environment file. Use a trusted operator environment for build, migration and seed; never put bootstrap credentials in the service env. The build requires the same `NEXT_PUBLIC_SITE_URL` as runtime; never use a live customer database merely to build. For example, in an isolated build workspace:

```sh
pnpm install --frozen-lockfile
DATABASE_URL='postgresql://build:unused@database.invalid:5432/automotive?schema=public' pnpm db:generate
DEPLOYMENT_ENV=production NEXT_PUBLIC_SITE_URL=https://cars.acme.example \
  DATABASE_URL='postgresql://build:unused@database.invalid:5432/automotive?schema=public' \
  SESSION_SECRET="$(openssl rand -hex 32)" STORAGE_PROVIDER=local \
  ALLOW_STANDALONE_LOCAL_STORAGE=true TRUST_PROXY=true pnpm build
```

Use independent runtime credentials after install. Startup preflight validates production env using the application schema, checks the exact expected hostname and DB/login in the URL and verifies the media link/permissions. It does **not** connect to the DB or verify host permissions from another customer. Log via journald. Configure customer-specific Nginx `access_log` and `error_log` destinations using the host's approved retention policy; restrict logs, avoid verbose secret-bearing dumps, and do not log headers or request bodies. Run `systemd-analyze verify` and `nginx -t` on the target before loading the unit or reloading Nginx.

### PostgreSQL and bootstrap

Provision with an administrative connection on the intended instance. The example uses `psql` password prompts so values do not enter SQL source/history. For remote DB traffic use a trusted TLS/private-network setup and verify actual transport. On a shared cluster also restrict access via PostgreSQL network/auth policy and remove CONNECT from PUBLIC for **all** customer databases; their roles must have no other memberships or cross-database grants.

```sql
CREATE ROLE auto_acme_owner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE auto_acme LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
\password auto_acme_owner
\password auto_acme
CREATE DATABASE auto_acme OWNER auto_acme_owner;
REVOKE ALL ON DATABASE auto_acme FROM PUBLIC;
GRANT CONNECT ON DATABASE auto_acme TO auto_acme;
\connect auto_acme
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO auto_acme;
ALTER DEFAULT PRIVILEGES FOR ROLE auto_acme_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO auto_acme;
ALTER DEFAULT PRIVILEGES FOR ROLE auto_acme_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO auto_acme;
```

Using the owner/migrator URL only in an operator shell, run `pnpm db:generate`, `pnpm db:migrate:deploy`, then `pnpm exec prisma migrate status`. As owner, grant existing app tables/sequences as needed (including after a restore), then remove runtime access to migration metadata:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO auto_acme;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO auto_acme;
REVOKE ALL ON TABLE public."_prisma_migrations" FROM auto_acme;
```

Verify owner migrations are up to date; test the runtime login can read/write app data as intended and cannot create schema objects, read migration metadata, or connect to another customer's database. Switch to the dedicated runtime URL in the restricted operator shell for the one-shot `pnpm db:seed` using temporary `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Verify exactly one expected account. Unset credentials immediately. Existing extra or different-email accounts require explicit operator reconciliation; the seed refuses to choose or delete one. For rotation, stop the app first when immediate revocation matters, seed the same email with a new password, and verify old sessions fail after restart.

### HTTPS and health

Install the default reject fragment **once** per dedicated public listener and the per-customer vhost once. On an existing shared Nginx installation, reconcile current default vhosts and listener options with the operator instead of installing duplicate defaults. Install existing certificate/key material securely; this package does not issue certificates or change DNS. If IPv6 is unavailable, make listener changes consistently across both fragments. The app must only bind loopback; block direct upstream access from untrusted networks. The vhost fixes Host/forwarded origin for upstream, replaces forwarded client IP with the peer address and leaves Origin untouched for Next's Server Action check. Use direct Nginx ingress or separately verify any trusted edge proxy and real-IP configuration.

Use local loopback `/healthz` and HTTPS `/healthz` as process-liveness probes, then verify DB readiness separately through migration status, a runtime DB query, and a known storefront/Admin record. Start with `systemctl start automotive-acme`, check `systemctl status` and `journalctl -u automotive-acme`, and enable boot startup only after verification. Stop with `systemctl stop automotive-acme` before coordinated backup/upgrade. Use the checklist's hostile-header and media probes before admitting traffic.
