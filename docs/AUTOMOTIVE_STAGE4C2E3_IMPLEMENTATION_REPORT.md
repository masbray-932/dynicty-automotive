# Dynicty Automotive — Stage 4C.2E.3: Dealer data ownership foundation

**Verdict: PASS WITH LIMITATIONS.** Prisma, regression tests and the build passed. The migration and its constraints were not exercised against a running PostgreSQL database. This is a schema expansion, not tenant isolation.

## Baseline and scope

Verified GitHub `main` and the fetched tree at `c686c4625211af7b3deade43c7d0ed13a8a2aeb0` (merge of PR #9). Reviewed the 4C.2D architecture audit, 4C.2E.1/E.2 implementation reports, Prisma schema and existing migrations, inventory/car and taxonomy CRUD, catalog/home/detail/dashboard queries, auth and scope guard, existing tests, and deployment/rollback docs. Work was isolated from the prior worktrees.

Brand and CarModel remain dealer-owned in the target architecture. Existing global Brand name/slug, per-brand CarModel slug, global Car slug, and per-car image key constraints are retained during this stage. Existing IDs, rows, legacy relations and URL generation are unchanged.

## Ownership constraints

| Model | Additive fields and lookup keys | New ownership relationship when `dealerId` is present |
|---|---|---|
| Brand | Nullable `dealerId` FK to Dealer; unique `(dealerId, id)`. | Only a registered Dealer ID is accepted. |
| CarModel | Nullable Dealer FK; unique `(dealerId, id)` and `(dealerId, brandId, id)`. | `(dealerId, brandId) → Brand(dealerId, id)`; prevents a model from using a foreign or ownerless brand. |
| Car | Nullable Dealer FK; unique `(dealerId, id)`; index on `(dealerId, brandId, modelId)`. | `(dealerId, brandId, modelId) → CarModel(dealerId, brandId, id)`; matches owner and brand, with Brand ownership enforced transitively through CarModel. Both existing single-column relations remain. |
| CarImage | Nullable Dealer FK; unique `(dealerId, id)`; index on `(dealerId, carId)`. | `(dealerId, carId) → Car(dealerId, id)`; retains cascading deletion from Car, including the legacy path. The existing SQL-only primary-image partial unique index is untouched. |

Direct Dealer FKs restrict owner deletion and key changes while referenced. Composite FK parent-key updates are restricted; taxonomy parent deletion stays restricted. All new relationships and indexes are Prisma-representable. Composite unique selectors and owner-qualified relations are available to the existing server-only Prisma boundary for a later scoped DAL. No new application API or unchecked owner-accepting helper was exposed.

The new composite FKs intentionally use PostgreSQL's default `MATCH SIMPLE`: a non-null owner must match the referenced parent; a NULL child owner continues using the original single-column FK. In particular, a NULL child can still reference an owned parent. This is a transition state, not an isolation guarantee or authorization check. Nullable owners and existing unscoped legacy readers mean no owned inventory may be populated for another dealer while those readers/writers are in service.

## Compatibility, migration and rollback

`prisma/migrations/20261106000000_stage_4c2e3_inventory_ownership/migration.sql` matches the Prisma schema diff plus an explicit transaction wrapper and comments. It adds four nullable columns without defaults, unique/supporting indexes, and FKs. It contains no backfill, renames, DROP, or writes to existing data. Earlier SQL, including the primary-image invariant and dealer registry migration, is byte-unchanged.

The current routes, Admin guards, allowlisted mutation payloads, inventory queries, registry resolver, media and sessions have no source changes. Legacy writes still omit owner fields; old rows remain NULL. Registered dealer scopes are not connected to inventory. Dealer IDs from client input cannot activate a new owner write or authorize access through this change. Applying this migration does not backfill or switch legacy inventory to the registered resolver.

1. Before rollout, rehearse the complete history and separately apply just this migration to a disposable legacy restore. Verify original rows and relationships, query plans, lock duration and constraints. Apply and verify the additive migration before starting the new Prisma Client, which may select the new columns. No live migration is part of this stage.
2. Later, establish trusted dealer identity and a fully scoped DAL before exposing owned inventory. With unscoped traffic disabled or frozen and a verified mapping, backfill in FK order: Brand → CarModel → Car → CarImage. Preflight mismatched brand/model references; reject ambiguous ownership and reconcile counts. Do not silently reassign inventory.
3. Verify no NULL or mixed ownership, validate real PostgreSQL constraints and test reads, writes and media across tenants in isolation. Then tighten nullability and permissions in a separate reviewed migration. Replace global unique constraints only after scoped equivalents and consumers are verified.
4. Before ownership cutover, roll back application code while leaving additive DDL in place; rehearse the older client against the expanded schema. After independent owned inventory exists, never resume unscoped binaries or readers. Freeze traffic and use a known scoped release or coordinated backup recovery.

## Verification and limitations

| Check | Result |
|---|---|
| Prisma format, validate, Client generation | PASS, Prisma 6.19.0, isolated dependency copy and synthetic nonresolving URL. |
| Migration diff and source scope | PASS, schema-to-schema SQL comparison without a DB; old migrations, seeds, runtime and deployment files unchanged. |
| Full Vitest regression | PASS: 350 tests / 31 files, including legacy catalog, Admin, auth, registry and existing upload/media regression suites. Nine new schema tests inspect generated relations, global constraints, legacy nullable ownership, composite FK definitions and migration safety. |
| ESLint, Next typegen and TypeScript | PASS. |
| Production build | PASS, Next.js 16.3.5 webpack with synthetic staging configuration and nonresolving database URL. |
| Real PostgreSQL and browser | NOT VERIFIED. No authorized disposable PostgreSQL target or local PostgreSQL server/runtime was available. Existing service mocks and static schema checks do not execute the FK constraints. |

Required DB rehearsal cases: a clean migration chain and a legacy fixture; NULL legacy writes and deletion/cascade parity; same-owner inserts; rejection of unknown Dealer IDs, cross-dealer and ownerless parent targets with non-null child owner, and same-dealer wrong-brand model references; legacy primary-cover uniqueness, all global unique constraints, and transactional rollback. Production and staging were not accessed. No domains or dealers were created, and no deploy was performed.

## Changed files

- `prisma/schema.prisma`
- `prisma/migrations/20261106000000_stage_4c2e3_inventory_ownership/migration.sql`
- `tests/dealer-inventory-ownership-schema.test.ts`
- `docs/AUTOMOTIVE_STAGE4C2E3_IMPLEMENTATION_REPORT.md`
