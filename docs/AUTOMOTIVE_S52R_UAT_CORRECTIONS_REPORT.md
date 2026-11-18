# S5.2R Final UAT Corrections

## Baseline and branch

- Baseline: `61cf776653222105caede81e90c415bf8f973d1a`
- Branch: `feat/automotive-s5-2r-final-uat-corrections`
- Scope: exactly the mobile welcome typography limits and website ownership handover.

## Fix 1 — mobile typography

- Welcome heading mobile now accepts 16–48 px.
- Welcome description mobile now accepts 16–22 px.
- Admin labels and number-input constraints, Zod validation, public rendering tests, and PostgreSQL check constraints use the same boundaries.
- Existing values already inside the new ranges are unchanged. Historical 14–15 px description values are normalized to the new 16 px accessibility floor during migration so deployment cannot fail on the strengthened constraint.
- Desktop typography settings are unchanged.

## Fix 2 — Serahkan Website

- The owner-facing handover action is now labeled `Serahkan Website` and only asks for the buyer email.
- Creating a new handover revokes earlier unaccepted owner invitations for that dealer and issues a new 24-hour, hashed, single-use token.
- Activation claims the invitation with an atomic conditional update inside a serializable transaction.
- The buyer receives a new verified Admin account and password hash; an existing shared Admin account is never reused.
- All previous active owner memberships for the transferred dealer are revoked only after the buyer membership is created in the same transaction.
- Sessions for an old owner are deleted when that user has no other active tenant membership. Sessions needed for unrelated tenant access are retained, while the transferred dealer permission is removed.
- Replay, expiry, concurrent activation, missing initiating-owner access, and existing buyer email all fail without changing ownership.
- Completion is recorded in the Admin audit log without token material.

## Files changed

- `validation/dealer-content.ts`
- `features/content/content-editor.tsx`
- `prisma/migrations/20261119000000_s52r_mobile_typography/migration.sql`
- `features/auth/account-forms.tsx`
- `app/admin/(protected)/account/page.tsx`
- `server/auth/account-actions.ts`
- `tests/s52r-uat-corrections.test.tsx`
- This report

The service CTA, inventory timestamp, and branding color implementations are unchanged.

## Verification

- Prisma format/validate/generate: PASS
- ESLint: PASS
- TypeScript: PASS
- Focused S5.2R/S5.2Q regression: 52 passed, 0 failed
- Full Vitest application results: 556 passed, 5 skipped
- Production build: PASS
- `git diff --check`: PASS

Eight known Windows deployment-only checks remain unavailable: seven require symlink privileges and fail with `EPERM`; one compares LF against generated CRLF output. No application regression failed.

## Remaining limitation

No transactional email provider is configured. Handover creation therefore returns a warning and exposes the one-time URL only to the authenticated owner for delivery through an approved secure channel. It never claims that an email was sent, and ownership remains unchanged until buyer activation succeeds.
