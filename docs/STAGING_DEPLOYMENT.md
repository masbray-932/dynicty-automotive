# Dynicty Automotive Staging Deployment

Target: `https://automotive-preview.dynicty.com`. This run prepared the staging release but did not deploy it because no VPS, PostgreSQL, DNS, R2, Nginx, or certificate access was available and the Phase 6/7 source is still uncommitted.

## Isolation contract

| Resource | Staging value | Production safety rule |
| --- | --- | --- |
| Hostname | `automotive-preview.dynicty.com` | Never modify `automotive.dynicty.com`. |
| Site URL | `https://automotive-preview.dynicty.com` | Set once through `NEXT_PUBLIC_SITE_URL`. |
| Application path | `/var/www/dynicty-automotive-preview` | Do not reuse the production checkout. |
| Service | `dynicty-automotive-preview.service` | Do not edit/restart unrelated services. |
| Listener | `127.0.0.1:3101` | Never expose the raw Next.js port publicly. |
| Database | `dynicty_automotive_staging` | Use a dedicated role; never reuse a production URL. |
| Environment file | `/etc/dynicty-automotive-preview.env` | Keep outside Git with restricted permissions. |
| Media | Dedicated R2 bucket/prefix, or isolated local deployment directory | Never share production object keys or upload paths. |

## 1. Release gate

Review and commit the current Phase 6, Phase 7, and staging changes before deployment. Record the reviewed commit and deploy that exact commit; do not copy or deploy the current dirty worktree.

```bash
git status --short
git rev-parse HEAD
git show --stat --oneline <REVIEWED_COMMIT>
```

The current preparation was based on branch `main` at `cf6b86a2173a4a89a0949f95ae606b2579cc80a3`, with uncommitted hardening/deployment changes. That hash alone therefore does not contain this staging implementation.

## 2. PostgreSQL staging database

Run as a PostgreSQL operator and replace placeholders interactively. Do not put a real password in shell history or documentation.

```sql
CREATE ROLE dynicty_automotive_staging_app LOGIN PASSWORD '<OPERATOR_SUPPLIED_PASSWORD>';
CREATE DATABASE dynicty_automotive_staging OWNER dynicty_automotive_staging_app;
REVOKE ALL ON DATABASE dynicty_automotive_staging FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE dynicty_automotive_staging TO dynicty_automotive_staging_app;
```

Restrict network access to the application host, require encrypted transport where remote, and use the application role—not a superuser—in `DATABASE_URL`. Before migration, verify the parsed database name is exactly the staging database.

## 3. Environment

Copy `.env.staging.example` to `/etc/dynicty-automotive-preview.env`, replace all placeholders, and set ownership/permissions appropriate to the non-root service user:

```bash
sudo install -o root -g dynicty -m 0640 .env.staging.example /etc/dynicty-automotive-preview.env
sudoedit /etc/dynicty-automotive-preview.env
```

Required values include:

- `NODE_ENV=production`
- `DEPLOYMENT_ENV=staging`
- a staging-only `DATABASE_URL`
- a unique non-placeholder session secret of at least 48 characters
- `NEXT_PUBLIC_SITE_URL=https://automotive-preview.dynicty.com`
- `TRUST_PROXY=true` only when the process is loopback-only behind the supplied Nginx boundary
- an isolated storage selection

Generate a secret for operator placement without committing or printing it in reports:

```bash
openssl rand -base64 48
```

Local storage is permitted in production mode only when both `DEPLOYMENT_ENV=staging` and `ALLOW_STAGING_LOCAL_STORAGE=true`. This exception is intended for an isolated preview checkout and is not accepted for production deployment. Prefer a dedicated R2 staging bucket such as `dynicty-automotive-staging`; the current R2 `put`/`delete` operations still require completion and runtime verification.

## 4. Install, migrate, and seed

Install the reviewed commit in the dedicated path:

```bash
sudo install -d -o dynicty -g dynicty /var/www/dynicty-automotive-preview
cd /var/www/dynicty-automotive-preview
git fetch --all --prune
git checkout --detach <REVIEWED_COMMIT>
pnpm install --frozen-lockfile
```

Load the environment without echoing it, then run real migrations. Never use `prisma db push`, `migrate reset`, or database reset commands:

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm exec prisma migrate status
```

Confirm all three migrations are applied, including `20260914000000_phase_6_query_hardening`. If drift is reported, stop and investigate; do not silently reset.

Seed only the staging database. The seed refuses to run unless `DEPLOYMENT_ENV=staging` and the parsed database name contains `staging`.

```bash
read -r -p 'Staging admin email: ' STAGING_ADMIN_EMAIL
read -r -s -p 'Staging admin password: ' STAGING_ADMIN_PASSWORD
export STAGING_ADMIN_EMAIL STAGING_ADMIN_PASSWORD
pnpm db:seed:staging
unset STAGING_ADMIN_EMAIL STAGING_ADMIN_PASSWORD
```

The idempotent seed creates one staging-only administrator, preview-labelled DealerSettings, and a small inventory covering AVAILABLE NEW/USED, FEATURED, DRAFT, SOLD, several brands/models, transmissions, years, prices, and enough AVAILABLE records for pagination. It never deletes existing rows and stores only a bcrypt password hash.

## 5. Build

With the staging environment loaded:

```bash
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Do not continue if any command fails.

## 6. Storage

Preferred staging R2 setup:

- use a dedicated bucket or a strongly isolated staging prefix;
- grant the staging key only object read/write/delete on that staging namespace;
- configure a staging-only public media hostname;
- keep account ID/access keys server-only;
- narrow Next Image host configuration to the exact verified media host;
- smoke-test upload, multiple images, primary selection, reorder, deletion, logo replacement, and cleanup compensation.

If local storage is used, keep it under the dedicated staging checkout and persist/back up that directory across releases as required. Never symlink or mount it to a production upload directory. Uploaded test media must remain outside Git.

## 7. systemd service

Review `deploy/systemd/dynicty-automotive-preview.service.example`, replace the pnpm path, then install it as `/etc/systemd/system/dynicty-automotive-preview.service`. It runs as non-root from the dedicated staging directory and binds only to `127.0.0.1:3101`.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now dynicty-automotive-preview.service
sudo systemctl status dynicty-automotive-preview.service
curl --fail http://127.0.0.1:3101/healthz
```

Expected health response is only `{"status":"ok"}`. Confirm port availability before enabling the service with `ss -ltnp`; select a different dedicated loopback port if `3101` is occupied and update Nginx consistently.

## 8. Nginx, proxy trust, and noindex

Review `deploy/nginx/automotive-preview.dynicty.com.conf.example`, replace certificate paths, install it as a dedicated server block, and enable only that block. It proxies the staging hostname to `127.0.0.1:3101`, preserves Host/protocol, overwrites rather than appends client-supplied forwarding headers, supports Next.js upgrade connections, and adds a defense-in-depth staging noindex header.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Never reload if `nginx -t` fails. With direct origin traffic, `$remote_addr` is the limiter key. If Cloudflare proxying is enabled, configure Nginx real-IP restoration only from Cloudflare's published IP ranges and use `CF-Connecting-IP`; otherwise all visitors may share Cloudflare's IP and the login limiter remains only partially verified. Keep the application port inaccessible except from loopback so arbitrary clients cannot spoof trusted proxy headers.

Application-level staging protection adds `X-Robots-Tag: noindex, nofollow, noarchive` and `Cache-Control: private, no-store, max-age=0` to all responses. Staging `robots.txt` returns `Disallow: /` and no sitemap. These rules are activated only by `DEPLOYMENT_ENV=staging`, leaving production SEO behavior unchanged.

## 9. DNS and TLS

Create or verify only the staging record, such as `A automotive-preview -> <STAGING_VPS_IPV4>`. Do not change `automotive.dynicty.com` or unrelated wildcard records. If Cloudflare proxying is used, select Full (strict), never Flexible.

Reuse a wildcard certificate only after confirming it covers `automotive-preview.dynicty.com`; otherwise obtain a hostname certificate using the existing Dynicty certificate process. Validate the origin certificate, then verify:

```bash
curl -I http://automotive-preview.dynicty.com/
curl -I https://automotive-preview.dynicty.com/
curl https://automotive-preview.dynicty.com/healthz
curl https://automotive-preview.dynicty.com/robots.txt
```

HTTP must redirect once to HTTPS without loops, the certificate must validate, the Host must route to this repository rather than a Dynicty fallback, and all staging responses must carry the noindex header.

## 10. QA and logs

Use only staging/test records. Verify admin login/logout/limiter/cookies, dashboard, car/brand/model CRUD, images, settings/logo; then verify Homepage, catalog filters/sort/pagination, AVAILABLE detail/related/WhatsApp/404 and DRAFT/SOLD hiding. Test widths near 390, 768, and 1280 pixels and inspect browser console, CSP, mixed content, failed assets/actions, and layout overflow.

```bash
journalctl -u dynicty-automotive-preview.service --since '15 minutes ago'
sudo tail -n 200 /var/log/nginx/error.log
sudo tail -n 200 /var/log/nginx/access.log
```

Logs must not contain passwords, session tokens, database URLs, or R2 credentials.

## 11. Update and restart

```bash
cd /var/www/dynicty-automotive-preview
git fetch --all --prune
git checkout --detach <NEW_REVIEWED_COMMIT>
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate:deploy
pnpm lint && pnpm typecheck && pnpm test && pnpm build
sudo systemctl restart dynicty-automotive-preview.service
sudo systemctl status dynicty-automotive-preview.service
curl --fail http://127.0.0.1:3101/healthz
```

## 12. Rollback and cleanup

Application rollback: check out the prior reviewed commit, reinstall with the frozen lockfile, rebuild, and restart only the preview service. Database migrations are not automatically reversible; prefer a compatible forward fix or restore a pre-change staging dump into an isolated database and switch the staging environment after verification. Preserve staging uploads during application rollback.

To retire staging, first remove only the preview DNS record and Nginx block, stop/disable only `dynicty-automotive-preview.service`, archive any required test data/media, and then remove the dedicated staging database/bucket/path after explicit operator confirmation. Never use broad recursive deletion or wildcard DNS/service changes.
