# S5.2S Password Validation UX

## Baseline

- Branch: `feat/automotive-s5-2s-password-validation-ux`
- Baseline commit: `573dd3d723dbb3577108921af7c16e41310b0944`
- No database migration was required.

## Implementation

- Added one shared password policy for buyer activation, Admin password changes, and Admin seed credentials.
- Passwords require 12–128 characters, uppercase, lowercase, digit, and a non-whitespace special character.
- Buyer activation shows a live five-item checklist with `✓` and `○` symbols plus screen-reader status text, so state is not conveyed by color alone.
- The reusable password field starts hidden and provides an eye-button with `aria-label` and `aria-pressed` state.
- Visibility changes preserve the controlled value and restore focus plus the previous selection/cursor range.
- Client HTML constraints and server-side Zod validation use the same policy.
- Activation renders every actionable password issue at field level. The Server Action also returns a specific password-policy message rather than the previous generic activation message.
- Existing bcrypt hashing, token expiry/single-use claim, serializable ownership transfer, old-owner revocation, audit logging, and tenant isolation are unchanged.

## Changed files

- `validation/password.ts`
- `validation/account.ts`
- `validation/auth.ts`
- `features/auth/secure-password-field.tsx`
- `features/auth/invitation-form.tsx`
- `features/auth/account-forms.tsx`
- `server/auth/account-actions.ts`
- `tests/s52s-password-validation-ux.test.tsx`
- `tests/s52r-uat-corrections.test.tsx`
- This report

## Verification

- Focused password and handover regression: 42 passed, 0 failed
- Full application suite: 567 passed, 5 skipped
- ESLint: PASS
- TypeScript: PASS
- Prisma validation: PASS
- Production build: PASS
- `git diff --check`: PASS

The eight known Windows deployment-only failures remain: seven symlink operations require privileges unavailable on this host (`EPERM`), and one fixture compares LF with Windows CRLF output. No application test failed.

## Limitations

- Interactive browser automation was not used. Toggle state, value contract, cursor-restoration implementation, accessible markup, live requirement computation, and server validation were verified through focused automated tests and production compilation.
- No real invitation or ownership transfer was performed.
