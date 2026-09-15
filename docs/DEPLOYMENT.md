# Dynicty Automotive Production Deployment

Target: `https://automotive.dynicty.com`. These instructions are prepared, not evidence that the infrastructure exists.

## 1. System requirements

- Linux VPS with a non-root `dynicty` service user.
- Node.js version compatible with Next.js 16, Corepack, and pnpm 11.19.0.
- Nginx, systemd, PostgreSQL client tools, Git, and a valid `*.dynicty.com` or hostname certificate.
- Reachable PostgreSQL database and Cloudflare R2 bucket.
- Raw Next.js port `3107` bound to loopback and blocked from public access.

## 2. Install

```bash
sudo install -d -o dynicty -g dynicty /var/www/dynicty-automotive
sudo -u dynicty git clone <REPOSITORY_URL> /var/www/dynicty-automotive
cd /var/www/dynicty-automotive
corepack enable
pnpm install --frozen-lockfile
```

For an update, fetch the reviewed release/commit and keep the previous commit SHA for rollback. Never deploy an unreviewed dirty worktree.

## 3. Environment

Copy `deploy/env/production.env.example` to `/etc/dynicty-automotive.env`, replace every placeholder, set owner `root:dynicty`, and mode `0640`. Do not commit the real file.

Required production values include `NODE_ENV=production`, PostgreSQL URL, a unique non-placeholder 48+ character session secret, `NEXT_PUBLIC_SITE_URL=https://automotive.dynicty.com`, `STORAGE_PROVIDER=r2`, `TRUST_PROXY=true`, and all R2 fields. Generate a secret for operator placement without writing it into Git:

```bash
openssl rand -base64 48
```

Validate by starting/building with the environment loaded. Never print the environment or connection URL.

## 4. PostgreSQL and migrations

Create a dedicated database/user with only the privileges required on its schema. Require encrypted remote connectivity and firewall the server. From the release directory with the environment loaded:

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm exec prisma migrate status
```

Do not use `prisma db push`, reset, or automatic destructive drift repair. Confirm `20260913000000_phase_0_foundation`, `20260913010000_phase_1_primary_image_constraint`, and `20260914000000_phase_6_query_hardening` are applied. Inspect `Car_status_updatedAt_idx` and the primary-image partial index through read-only PostgreSQL catalog queries.

## 5. Initial admin and settings

Set temporary strong `ADMIN_EMAIL` and `ADMIN_PASSWORD` only in the operator shell, run `pnpm db:seed`, then unset both. Do not place them in service logs/history or commit them. Verify exactly the intended normalized admin exists and its stored value is a bcrypt hash. The seed safely upserts the fixed DealerSettings ID `default`; real dealer details must be entered through admin settings.

## 6. R2

The current `R2StorageProvider` public URL boundary exists, but `put` and `delete` deliberately throw. Before setting production live, implement those two operations with an S3-compatible client, endpoint `https://<account-id>.r2.cloudflarestorage.com`, existing server-only credentials, and the configured bucket. Grant only object read/write/delete for that bucket; never public write.

Verify JPEG/PNG/WEBP upload, delete, public read URL, replacement compensation, and orphan warning behavior. Configure an exact custom/public media hostname and only then add that exact hostname to Next Image `remotePatterns`. Until then remote media stays conservative/unoptimized.

Enable R2 object versioning if available for the chosen account/bucket, or maintain a separate media backup. Define lifecycle retention for old versions; R2 durability does not protect against authorized deletion or operator error.

## 7. Build and service

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Replace placeholders in `deploy/systemd/dynicty-automotive.service.example`, install it under `/etc/systemd/system/`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now dynicty-automotive
sudo systemctl status dynicty-automotive
curl --fail http://127.0.0.1:3107/healthz
journalctl -u dynicty-automotive --since '10 minutes ago'
```

The service example runs `pnpm exec next start -H 127.0.0.1 -p 3107`. The process must run as `dynicty`, not root, and listen only on that loopback address. `/healthz` is shallow by design and returns only `{"status":"ok"}`; monitor a separate public page for end-to-end availability.

## 8. Nginx, real IP, DNS, and SSL

Install the reviewed `deploy/nginx/automotive.dynicty.com.conf.example` after replacing certificate paths. Validate with `sudo nginx -t` before reload. The config overwrites `X-Real-IP` and `X-Forwarded-For` with Nginx's `$remote_addr`; it does not append a public client-supplied chain. Combined with a loopback-only app port, this makes `TRUST_PROXY=true` safe for the login limiter.

If Cloudflare proxies traffic, configure Nginx real-IP handling only with Cloudflare's published IP ranges, automate range updates, and set `real_ip_header CF-Connecting-IP`; otherwise `$remote_addr` is Cloudflare and all visitors can share one limiter key. Verify this before cutover. Use Cloudflare SSL mode Full (strict), never Flexible.

Create only the required `A automotive -> <VPS_IPV4>` (or architecture-equivalent) record after all cutover gates pass. Reuse wildcard TLS only after `openssl s_client`/browser verification confirms hostname coverage. Verify HTTP redirects once to HTTPS without a loop.

## 9. Smoke tests

Before DNS: use an approved staging/internal host and exercise login/logout/limiter/session, CRUD, all image formats, settings/logo/dashboard, public AVAILABLE visibility, filters/pagination/detail/WhatsApp/404, metadata/JSON-LD/sitemap/robots, headers/CSP, console, keyboard, and 390/768/1280px layouts. Avoid destructive operations on real inventory.

After DNS:

```bash
curl -I https://automotive.dynicty.com/
curl -I https://automotive.dynicty.com/admin/login
curl https://automotive.dynicty.com/robots.txt
curl https://automotive.dynicty.com/sitemap.xml
```

Confirm no localhost/staging URL appears and inspect CSP/HSTS/admin cache/noindex headers.

## 10. Backups

Use a root-owned `0600` PostgreSQL password file or service definition; do not place passwords in scripts. Schedule nightly custom-format dumps to `/var/backups/dynicty-automotive/postgres/`, copy them off-VPS, retain 14 daily and 8 weekly recovery points, and alert on age/failure.

```bash
backup_dir=/var/backups/dynicty-automotive/postgres
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
install -d -m 0700 "$backup_dir"
PGPASSFILE=/etc/dynicty-automotive.pgpass pg_dump --host=<DB_HOST> --username=<APP_USER> --dbname=dynicty_automotive --format=custom --file="$backup_dir/db-$timestamp.dump"
pg_restore --list "$backup_dir/db-$timestamp.dump" >/dev/null
find "$backup_dir" -type f -name 'db-*.dump' -mtime +14 -delete
```

Test restore only into an isolated staging database, never over production:

```bash
PGPASSFILE=/etc/dynicty-automotive.pgpass pg_restore --host=<DB_HOST> --username=<RESTORE_USER> --dbname=<EMPTY_STAGING_DB> --exit-on-error <DUMP_FILE>
```

## 11. Logs and monitoring

Use `journalctl -u dynicty-automotive`, Nginx access/error logs, a basic uptime monitor for `/healthz` plus `/`, database health/backup-age alerts, disk/memory/restart monitoring, and future Sentry at existing logger/error boundaries. Verify distro logrotate already covers Nginx/journal retention before adding anything.

## 12. Rollback

Application: stop traffic if data safety is uncertain, check out the previous reviewed commit/release, reinstall with frozen lockfile, rebuild, and restart. Database: Prisma migrations are not automatically reversible; inspect forward-fix feasibility first and restore the pre-deploy dump to a new database when rollback is required. Switch the environment only after restore validation. DNS: retain the previous target/TTL and restore it if cutover fails. Media: Phase 7 introduces no destructive media migration; preserve R2 versions/backups and never bulk-delete during rollback.

After rollback, verify health, migration compatibility, login, public reads, logs, and headers. Record the failed release and do not repeatedly restart a broken build.
