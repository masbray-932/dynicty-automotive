# Security

## Authentication and sessions

Admin passwords use bcrypt cost 12. Login failures are generic and both existing and unknown emails run a bcrypt comparison. A bounded in-memory limiter tracks hashed per-client and per-client/email keys: five failures in a 15-minute window cause a five-minute block. This is appropriate for one persistent VPS process; multiple instances require a shared limiter in a later phase.

Production requires `TRUST_PROXY=true` only for the documented topology: the Next.js port is loopback-only and Nginx overwrites `X-Real-IP` and `X-Forwarded-For` with its trusted client address. When Cloudflare proxying is enabled, Nginx must first restore `$remote_addr` from `CF-Connecting-IP` using only Cloudflare's published source ranges. Without that verified topology, production limiter IP behavior remains blocked.

Sessions use 32 random bytes encoded as opaque base64url tokens. Only an HMAC-SHA-256 digest is stored. Cookies are `HttpOnly`, `SameSite=Lax`, path `/`, seven-day `expires`/`maxAge`, and `Secure` in production; no `Domain` is set. Logout invalidates the database row. Up to 100 expired rows are removed at session creation, and an encountered expired row is removed during lookup. `AdminSession.tokenHash` is unique and `expiresAt` is indexed.

All mutations are Server Actions, not GET requests. Every car, image, master-data, settings, logo, login, and logout mutation validates server input and independently calls `requireAdmin()` where authentication is required. Next.js Server Actions provide POST-only mutation requests and same-origin checks; the protected layout is defense in depth, not the sole authorization boundary.

## Headers and indexing

All responses receive CSP, `nosniff`, strict-origin referrer policy, restrictive permissions policy, frame denial, and same-origin opener policy. Production also receives one-year HSTS. The CSP permits the inline script/style behavior required by the current Next.js application and blocks objects, framing, and foreign form targets. Admin responses additionally use `private, no-store` and `X-Robots-Tag: noindex`; admin metadata also declares noindex/nofollow.

## Uploads, URLs, and storage

Car images accept JPEG, PNG, or WEBP up to 8 MB; logos use the same formats up to 4 MB. MIME type and binary signature must agree. Keys are server-generated UUID paths, sanitized, relative, and traversal checked. Storage-first writes compensate on database failure. Database-first deletion exposes cleanup warnings rather than rolling back a committed record deletion.

Dealer URLs accept only HTTP/HTTPS. WhatsApp numbers are normalized to 10–15 digits and messages use `URLSearchParams` against the fixed `https://wa.me` origin. Colors must be six-digit hex values. New-tab links use `noopener noreferrer`. Site canonical URLs come from one resolver.

## Configuration, errors, and logs

Production startup validation requires a non-placeholder secret of at least 48 characters, HTTPS `NEXT_PUBLIC_SITE_URL`, durable R2 selection, and all R2 variables. Database and R2 credentials remain server-only. User-facing errors omit Prisma, filesystem, credentials, stack traces, and account-existence details.

Structured JSON logs record meaningful auth, upload, storage, and public-service failures. Passwords, submitted email, session tokens, connection strings, storage keys, and credentials are intentionally excluded. Future Sentry integration should attach at the logger/error boundaries with the same redaction rules.

## Remaining limitations

- In-memory throttling is process-local and must be shared before horizontal scaling.
- Forwarded client IP accuracy depends on the Phase 7 reverse proxy replacing untrusted forwarding headers.
- R2 network operations remain deliberately unimplemented; production cannot use media uploads until Phase 7 completes and verifies the adapter.
- Database-backed behavior and response headers still require browser/VPS verification with PostgreSQL.
- `pnpm audit` reports two high transitive advisories in Prisma configuration tooling; update Prisma through a tested compatible release rather than forcing nested overrides.
