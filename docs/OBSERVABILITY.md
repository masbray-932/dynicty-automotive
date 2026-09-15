# Observability

`server/log.ts` emits one-line structured JSON with timestamp, level, event, and small non-sensitive context. Current events cover successful/failed/throttled login, session creation failure, logout cleanup, rejected/failed uploads, object cleanup warnings, settings failures, and unexpected public database/service failures.

The logger intentionally excludes passwords, submitted email, request bodies, session tokens/digests, `SESSION_SECRET`, `DATABASE_URL`, R2 credentials, full storage paths, and vehicle/dealer free text. Expected validation errors stay user-facing and are not logged as server faults.

Server services and actions are the future Sentry capture points. Client rendering failures are caught by the existing App Router error boundary; Phase 7 may connect it to a browser SDK after consent, release, and environment configuration are defined. Do not duplicate-capture the same exception at every layer.

Recommended production monitoring:

- process health, restart count, CPU, memory, disk, and event-loop pressure;
- HTTP status/error rate and latency by route class without query-content logging;
- PostgreSQL availability, connection saturation, slow queries, backup age, and migration status;
- R2 upload/delete failures and orphan cleanup alerts;
- repeated `admin.login_blocked` events without recording credentials or email;
- uptime checks for Homepage, catalog, login, robots, and sitemap.
