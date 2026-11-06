# Dynicty Automotive — Stage 4C.2E.2: Dealer Registry Service and Domain Resolution

**Verdict: PASS WITH LIMITATIONS.** The internal read-only service and application checks passed. Database-backed resolution and ingress are not verified, and registry mutations remain deferred.

## Baseline and scope

GitHub and Git fetch both returned `main` at `4142f1c9108bf9c2f62ac2749b22be22582d6baf` (PR #8 merge). Its tree is identical to verified 4C.2E.1 implementation `cee72ec7b69305691f41309ec7810617d9523371`. Reviewed the merged 4C.2D audit, 4C.2E.1 report, Prisma models and SQL constraints, legacy scope adapter, auth/session, authorization guards and existing tests. The branch was built in a separate worktree.

## Implemented contract

- `normalizeDealerHostname(input)` accepts only bare DNS hostnames. It applies Node IDNA ASCII conversion, lowercasing and removal of at most one terminal dot. It rejects whitespace/control characters, URI delimiters, percent escapes, forwarded lists, IP literals, ports, wildcard/single-label names, malformed labels and DNS length violations. It does not prove DNS ownership or accept a forwarded authority.
- `resolveDealerDomain(input)` performs an exact normalized hostname lookup using a server-only Prisma read at repeatable-read isolation. It checks one matching binding, an active registered owner, and exactly one same-owner, verified, active canonical binding. Verification/activation timestamps and positive binding versions are required. Missing, invalid, duplicate or inconsistent data returns null; database errors propagate without a legacy fallback. Global hostname uniqueness and the canonical partial unique index remain enforced by the existing migration when applied; this stage adds no DDL.
- Output contains only the registered scope and routing metadata (requested and canonical hostnames, binding ID/version). There is no AdminUser, session, settings, media or inventory projection. A resolved host is a public selector, never authorization. Existing session and platform permission boundaries are unchanged.
- There are no registry writes, Server Actions, route handlers, DNS/ingress changes, or storefront callers. The verified platform issuer/grant path does not exist yet, so exposing registry mutations would be unsafe. Existing dealer sessions cannot grant platform authority. Legacy single-dealer routing and all data associations remain unchanged.

## Validation

| Check | Result |
|---|---|
| Full regression suite | PASS: 341 tests across 30 files, including 55 new tests for normalization, lookup, ambiguous/invalid/cross-owner data, authorization separation and error handling. Existing single-dealer and auth regression suites passed. |
| ESLint | PASS. |
| Next typegen and TypeScript | PASS. |
| Prisma validate | PASS with a synthetic nonresolving database URL; no migration or DB access. |
| Production build | PASS. Next.js 16.3.5 webpack build using synthetic staging configuration and a nonresolving database address. |
| Live PostgreSQL, ingress, browser and domain activation | NOT VERIFIED. Resolver tests mock Prisma; they do not prove PostgreSQL constraints, snapshot behavior in the deployed pool, TLS, or host-header trust. |

Before wiring the resolver to requests, establish a trusted ingress boundary, reject unknown hosts at the caller, verify the exact PostgreSQL migration and pool behavior on disposable PostgreSQL, and prove dealer-scoped data paths. A repeatable-read snapshot is not a suspension or revocation mechanism; activation and canonical swaps need a verified platform identity and transactional lifecycle service. No dealer/domain records were created or activated and no database or deployment changes were made.

## Changed files

- `server/dealer/hostname.ts`
- `server/dealer/registry.ts`
- `tests/dealer-domain-resolution.test.ts`
- `docs/AUTOMOTIVE_STAGE4C2E2_IMPLEMENTATION_REPORT.md`
