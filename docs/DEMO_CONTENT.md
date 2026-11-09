# Controlled demonstration content

This is an operator-only tool for a fresh **disposable local demo installation**. It is never invoked by startup, build, migration, or deployment. It creates the explicitly fictional **Dynicty Auto Demo** identity, two service categories, two sample services, two complete original articles, welcome/profile/history/vision/mission, advantages, and FAQ. Achievements are empty. There are no customer testimonials, star ratings, real partnerships, administrator credentials, vehicle inventory, or externally sourced images.

Promo and leasing presentation entries remain **inactive** and explicitly labeled as examples. Neutral PNG placeholders are generated locally using the existing Sharp dependency. They are layout placeholders, not commercial offers or partner logos. S5.2C must retain those labels and leave testimonials hidden until genuine authorized content is supplied.

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
7. Inspect Admin before exposing any demo preview. New public service/article pages are a subsequent-stage responsibility. Preview hosts must retain global staging noindex.

## Safety and repeatability

The seed checks both the configured and actual PostgreSQL database name, takes a transaction-scoped advisory lock, and refuses non-demo settings, registered dealers/domains, inventory, or unknown CMS records. Stable IDs and `upsert` with empty updates make repeated invocation a no-op for existing seeded records, preserving operator edits. If an operator adds unrelated records or changes the fictional identity, further seed invocation is deliberately refused. Do not bypass that refusal.

Media creation uses exclusive writes and refuses different existing bytes or symlinked child directories. Identical generated placeholders can be reused. File creation follows the DB safety transaction: a filesystem failure can leave inactive placeholder references and should be corrected by safely rerunning the same seed; it does not publish a broken promotion. This is not a distributed DB/filesystem transaction.

For cleanup, stop the disposable demo process and have the operator remove **only the independently verified disposable demo database and its dedicated media directory**. The application provides no reset, truncate, or customer-data cleanup endpoint. For a fresh demo, provision fresh isolated resources. Never reuse customer database credentials or media roots.

## Verification

`tests/editorial-postgres.test.ts` runs only when `EDITORIAL_TEST_DATABASE_URL` explicitly identifies a fresh loopback disposable demo DB. Apply all migrations first, then run:

```sh
pnpm exec vitest run tests/editorial-postgres.test.ts
```

The four integration cases verify real CRUD, owner-qualified reads, PostgreSQL FK/unique/CHECK rejection, publication, and seed idempotency. Authentication is stubbed in those service tests; production-mode browser login is separate evidence. Do not rerun this integration suite on an existing edited demo: its refusal checks intentionally introduce non-seed fixtures. Use a fresh disposable database.
