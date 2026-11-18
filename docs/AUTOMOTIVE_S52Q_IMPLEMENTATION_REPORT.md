# S5.2Q Final Pre-Production Revision

## Baseline

- Working branch: `feat/automotive-s5-2q-final-preproduction`
- Parent development branch: `feat/automotive-standalone-s5-2d-public-redesign`
- Baseline HEAD: `f2c9073ad9ad12dd6a8a2487978ae43f6215da77`
- No production database, infrastructure, domain, or deployment was accessed.

## Implemented revisions

1. Per-service CTA: tenant/service-scoped Prisma models, responsive public banner, independent desktop/mobile typography, colors, optional 800×600 image, and ordered WhatsApp buttons. Admin supports enable, add/remove/reorder, image replacement/removal, and server-side validation.
2. Mobile font minimum: both mobile heading and description enforce a 16 px minimum in HTML controls, Zod validation, and database check constraints.
3. Inventory timestamp: `DealerSettings.inventoryUpdatedAt` is updated in the same serializable transaction only when public inventory membership changes through create, delete, status/condition changes, or inventory-mode changes. Price, description, photo, and other non-membership edits do not update it. Homepage reads this tenant-scoped value and formats date and time in `Asia/Jakarta`.
4. Branding colors: the historical color-picker interaction is restored next to the existing HEX input. Stored values remain intact and blank values still select the platform fallback.
5. Admin handover: verified tenant memberships, owner invitation/activation, hashed expiring single-use tokens, secure password hashing, verified email-change tokens, session listing/revocation, last-owner protection, and audit records were added without a parallel authentication system.

## Migration

`20261118000000_s52q_preproduction` adds the inventory timestamp, service CTA tables, tenant Admin memberships, invitations, email-change tokens, audit log, and Admin identity/security fields. Existing Admin users are backfilled as verified owners of the legacy `default` dealer; existing content relationships are retained.

## Verification

- `pnpm exec prisma validate` (CI-only loopback URL): PASS
- `pnpm exec prisma generate`: PASS
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- Focused S5.2Q/auth/editorial/settings regression: 77 PASS, 0 FAIL
- Full Vitest: 543 PASS, 5 SKIPPED, 8 Windows deployment-only FAIL
- `pnpm build`: PASS
- `git diff --check`: PASS

The eight full-suite failures are baseline Windows-only deployment checks: seven symlink operations fail with `EPERM`, and one systemd fixture assertion expects LF while the generated file is CRLF. Application and non-deployment regression tests pass.

## Limitations

- No transactional email provider is configured. Invitation and email-verification token creation, expiry, single use, activation, and authorization are implemented, but actual email delivery is **BLOCKED**. Admin displays the sensitive one-time URL for delivery through a separately approved secure channel.
- Exact 390 px browser verification was not executed in this implementation run. Responsive behavior is implemented and production compilation succeeds; live visual QA remains required before launch.
- The migration was reviewed and Prisma-validated but was not applied to production or preview.

## Preview deployment procedure

1. Back up and verify the isolated preview database.
2. Fetch and check out the approved S5.2Q commit on the preview host.
3. Load the existing preview-only environment without printing secrets.
4. Run `pnpm install --frozen-lockfile`, `pnpm exec prisma migrate deploy`, and `pnpm build`.
5. Restart only the existing preview application service.
6. Verify health, Admin login/membership backfill, service CTA CRUD/public rendering, inventory timestamps, branding colors, and invitation activation using a disposable preview-only account.
7. Do not use manual invitation links until an approved secure delivery channel is defined.
