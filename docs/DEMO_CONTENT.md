# Controlled demonstration content

This is an operator-only tool for a fresh **disposable local demo installation**. It is never invoked by startup, build, migration, or deployment. It creates the explicitly fictional **Dynicty Auto Demo** identity, two service categories, four sample services, four complete original articles, welcome/profile/history/vision/mission, advantages, and FAQ. Achievements are empty. There are no customer testimonials, star ratings, real partnerships, administrator credentials, externally sourced images, or fabricated business achievements.

The seed now includes **16 fictional vehicles** (14 AVAILABLE, one DRAFT, one SOLD), four brands and eight models, plus a main banner, promo presentation, showroom illustration and clearly labeled leasing demo. All PNGs are original geometric illustrations generated locally using Sharp and validated with the existing 8 MiB / 25 MP raster validator. They are explicitly **not photos of real units, commercial promotions or real partner logos**. No testimonials are seeded.

The default WhatsApp value `12025550123` is a fictional demonstration contact, not a showroom service or verified WhatsApp account. Do not actually message it. Configure a genuine authorized showroom number through Admin for real inquiries; clearing it exercises the graceful missing-contact state. The preview identity/address/hours remain clearly fictional.

## Invocation

1. Provision an empty, disposable PostgreSQL database with a dedicated operator-controlled role. Its name must match `dynicty_automotive_demo_[a-z0-9_]+` and its connection must use loopback (`127.0.0.1`, `localhost`, or `::1`). Do not point at an existing customer installation.
2. Set `DATABASE_URL` privately in the operator's environment; do not copy real credentials into this document or Git.
3. Apply the real migration history using `pnpm db:migrate:deploy`.
4. Create a dedicated empty media directory outside release directories. Link `public/uploads` to that directory and set `DEMO_MEDIA_ROOT` to its absolute real path. Use the installation's unprivileged account and restrictive ownership. Never point this at customer media.
5. Explicitly invoke:

```sh
DEMO_CONTENT=true NODE_ENV=development DEPLOYMENT_ENV=staging \
STORAGE_PROVIDER=local DEMO_MEDIA_ROOT="$DEMO_MEDIA_ROOT" pnpm db:seed:demo
```

`NODE_ENV=production` is refused even for a staging build. Run the seed as an explicit pre-runtime operation; then launch the application with its normal validated production-mode staging environment. Do not weaken production environment validation to run the seed.

6. Bootstrap a separate disposable primary administrator through the existing secure operator workflow (`ADMIN_EMAIL` and `ADMIN_PASSWORD` privately supplied to `pnpm db:seed`). The content seed creates no credentials.
7. Inspect Admin before exposing any demo preview. Public service/article pages now read only published same-owner content. Preview hosts must retain global staging noindex.

## Safety and repeatability

The seed checks both the configured and actual PostgreSQL database name, takes a transaction-scoped advisory lock, and refuses non-demo settings, registered dealers/domains, unknown inventory, or unknown CMS records. Known stable demo brand/model/car/image IDs are allowed only with NULL dealer ownership and their expected relationships/storage-key associations. Reassigned ownership or references cause refusal. Stable IDs and `upsert` with empty updates make repeated invocation a no-op for existing seeded records, preserving operator edits. Price, text, status and other ordinary edits are preserved. Added inventory/image IDs, replaced image associations, unrelated content or a changed fictional identity cause further seed invocation to be deliberately refused. This never resets operator edits. Do not bypass that refusal.

Media creation uses exclusive writes and refuses different existing bytes or symlinked child directories. Identical generated illustrations can be reused; names are versioned so older neutral placeholders are not overwritten. Existing S5.2B demo rows remain unchanged on rerun (including their inactive promo state); an operator can publish/edit them explicitly through Admin. File creation follows the DB safety transaction: a filesystem failure can leave references without generated files and should be corrected by safely rerunning the same seed; do not expose a preview until all generation steps succeed and byte URLs are verified. This is not a distributed DB/filesystem transaction.

For cleanup, stop the disposable demo process and have the operator remove **only the independently verified disposable demo database and its dedicated media directory**. The application provides no reset, truncate, or customer-data cleanup endpoint. For a fresh demo, provision fresh isolated resources. Never reuse customer database credentials or media roots.

## Verification

`tests/editorial-postgres.test.ts` runs only when `EDITORIAL_TEST_DATABASE_URL` explicitly identifies a fresh loopback disposable demo DB. Apply all migrations first, then run:

```sh
pnpm exec vitest run tests/editorial-postgres.test.ts
```

The five integration cases verify real CRUD, owner-qualified reads, PostgreSQL FK/unique/CHECK rejection, publication, and seed idempotency. Authentication and the pure media URL provider are stubbed in those service tests; production-mode browser login is separate evidence. Do not rerun this integration suite on an existing edited demo: its refusal checks intentionally introduce non-seed fixtures. Use a fresh disposable database.

## Public search browser regression (S5.2C)

After successful seeding and starting a local disposable production build behind its HTTPS ingress, run the committed read-only regression script. It checks the exact six controls/native GET, brand/model reset, parameter round-trip and exact price bounds, sorting retention, server pagination, and safe malformed ranges. It expects the untouched demo inventory (14 AVAILABLE records); operator edits can intentionally change those expectations.

```sh
PUBLIC_QA_DISPOSABLE=true PUBLIC_QA_BASE_URL=https://127.0.0.1:8443 \
node scripts/verify-six-field-search.mjs
```

Playwright is an optional verification tool, not an application dependency. If it is installed outside the repository, provide `PLAYWRIGHT_MODULE` as its absolute module path and `BROWSER_EXECUTABLE_PATH` as the installed Chromium executable. For an isolated self-signed test certificate only, explicitly set `PUBLIC_QA_ALLOW_SELF_SIGNED=true`. The script refuses non-loopback origins and does not create records, log personal inquiry data, or change infrastructure. Do not forward the local test port to customer production.
