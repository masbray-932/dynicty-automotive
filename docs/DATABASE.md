# Database

## Models

- `AdminUser`: normalized unique email and bcrypt password hash.
- `AdminSession`: HMAC-hashed opaque token, owner, and expiry; cascading deletion on admin removal.
- `Brand`: unique name and slug.
- `CarModel`: belongs to a brand and has a brand-scoped unique slug.
- `Car`: new/used condition, draft/available/sold status, dealer-facing vehicle facts, and indexes for catalog queries.
- `CarImage`: ordered object key with primary-image flag; cascades with its car.
- `DealerSettings`: singleton-ready configuration record with dealer identity and contact channels.

Prices use PostgreSQL `DECIMAL(15,0)`, avoiding floating-point money errors and representing Indonesian Rupiah without a fractional unit. Mileage is nullable; new cars can use null or zero, while used-car validation will require a sensible value in the CRUD phase. Primary-image uniqueness is a transactional application invariant because Prisma schema syntax cannot express the desired partial unique index portably. Car-brand/model consistency is also validated in the service layer.

## Migration workflow

Development changes use `pnpm db:migrate -- --name descriptive_name`. Review the generated SQL and commit it. Production uses `pnpm db:migrate:deploy`; `prisma db push` is not a production strategy. The initial Phase 0 SQL is committed under `prisma/migrations/`.

The seed upserts one admin and default dealer settings. It requires `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD`; plaintext credentials are never stored.

Phase 1 adds no Prisma model or column. A SQL-only migration adds the partial unique index `CarImage_one_primary_per_car`, enforcing at database level that each car has at most one primary image. Application transactions preserve deterministic contiguous `sortOrder` values during normal reorder/delete operations. The optional seed now adds four small brand/model pairs and no fake car inventory.

Phase 5 preserves the schema and upserts DealerSettings exclusively against fixed ID `default`; no settings rows or migration are added. Dashboard metrics use database counts/grouping and do not alter public visibility.

Phase 6 adds the real migration `20260914000000_phase_6_query_hardening`. Its `(status, updatedAt)` index directly supports latest AVAILABLE inventory and bounded sitemap ordering. Existing unique session digest and expiry indexes already support lookup and cleanup, so no speculative session index was added.
