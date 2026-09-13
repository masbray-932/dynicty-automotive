# Security Foundation

- Passwords are hashed with bcrypt cost 12 and never logged or stored as plaintext.
- Login returns a generic failure to reduce account enumeration.
- Sessions use 256-bit random opaque tokens. Only an HMAC-SHA-256 digest is persisted.
- The session cookie is HTTP-only, `SameSite=Lax`, path-scoped to `/`, and secure in production.
- Sessions expire after seven days and are deleted on logout.
- Protected admin routes authorize in a server layout. Every future Server Action must independently call authorization and validate untrusted input.
- Zod validates environment and login input. Secrets have no `NEXT_PUBLIC_` prefix.
- Storage keys reject traversal. Rendering uses React escaping; no unsafe HTML is used.
- `.env*`, local uploads, dependencies, and build artifacts are ignored.

## First administrator

Set temporary `ADMIN_EMAIL` and a unique password of 12–128 characters containing uppercase, lowercase, and numeric characters. Run `pnpm db:seed`, then remove those two values from the runtime environment. Rotate credentials if they are exposed. Production should add login throttling, audit logging, session cleanup, and security headers during hardening.
