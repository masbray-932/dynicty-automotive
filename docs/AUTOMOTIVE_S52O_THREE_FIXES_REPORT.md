# Dynicty Automotive — S5.2O Three Fixes Report

## Verified baseline

- Repository: `C:\Projects\dynicty-automotive`
- Branch: `feat/automotive-standalone-s5-2d-public-redesign`
- Local and remote starting HEAD: `1cd6e984a3a77815bddd8cfdc15a64500dce1cca`
- PR #20: existing feature PR targeting `main`; no new PR was created.
- Initial working tree contained exactly the four previously implemented hotfix files described below. No reset, discard, merge, deployment, or database write was performed.

## Implemented fixes

### 1. Mobile WhatsApp label clipping

**Root cause:** the shared CTA used an inflexible 54px icon column, a non-wrapping label with fixed horizontal padding, and `overflow-hidden`. Inside a narrow sales card this allowed the CTA's intrinsic width to exceed the content column, clipping the right side of “Hubungi via WhatsApp”.

**Fix:** the shared CTA now uses `max-w-full`, `min-w-0`, a shrink-safe label region, normal wrapping, centered text, responsive icon width and mobile padding. The clipping constraint was removed. Sales cards give the CTA the full available card width. The approved green gradient, icon, radius, focus treatment, link target and dealer-specific WhatsApp URL remain unchanged. Because the fix is shared, header/menu, vehicle detail, contact and sell-car usages retain the same safer width behavior.

### 2. Duplicate homepage vehicle search

**Root cause:** after search moved into the two-row header, the legacy homepage `QuickSearch` render path remained. Commit `1cd6e984a3a77815bddd8cfdc15a64500dce1cca` removed that redundant render path before this recovery run.

**Fix verification:** the homepage no longer imports or renders `QuickSearch` or the “Pencarian mobil” section. The functional header GET `/cars` search remains, and advanced catalog filters remain on `/cars`. Regression expectations were updated to reject the removed homepage fields rather than restoring them.

### 3. Dealer-scoped new-car CTA

**Root cause:** public behavior is already conditional on `DealerSettings.inventoryMode`, but the preview symptom can persist when the actual Autoeighteen row remains `BOTH`.

**Fix verification:** for `USED_ONLY`, the homepage omits `/cars?condition=NEW`, retains `/cars?condition=USED` and `/cars`, and existing header/catalog/server queries continue enforcing the used-only condition. `BOTH` still renders both conditions for other dealers. Tests cover both modes without deleting or rewriting vehicle records.

## Changed files

- `components/public/whatsapp-link.tsx`
- `features/sales-team/public-sales-team.tsx`
- `tests/content-pages.test.tsx`
- `tests/s52o-final-revisions.test.tsx`
- `docs/AUTOMOTIVE_S52O_THREE_FIXES_REPORT.md`

## Verification results

- `node --env-file=.env.local node_modules\prisma\build\index.js validate` — PASS
- `pnpm db:generate` — PASS, Prisma Client 6.19.0 generated
- `pnpm lint` — PASS
- `pnpm typecheck` — PASS
- `pnpm build` — PASS, 22 application routes generated/compiled
- `pnpm exec vitest run tests/content-pages.test.tsx tests/s52o-final-revisions.test.tsx tests/s52n-customer-revisions.test.tsx tests/brand-sales-domain.test.tsx tests/public-website.test.tsx` — PASS, 5 files / 41 tests
- `pnpm exec vitest run --exclude tests/standalone-deployment.test.ts` — PASS, 51 files passed, 1 skipped; 526 tests passed, 5 skipped
- `git diff --check` — PASS; only Git's informational LF-to-CRLF working-copy warnings were emitted

## Browser QA

**NOT TESTED.** Browser and Computer Use automation were explicitly excluded from this recovery task. No visual PASS is claimed for 320/375/390/430/768/1280px. The responsive behavior is covered by component classes and regression assertions, but deployed-device confirmation remains a preview/UAT prerequisite.

## Autoeighteen configuration status

The actual Autoeighteen preview database/Admin row was not accessed and was not modified, so `inventoryMode=USED_ONLY` is **not verified** for that tenant. This is a configuration limitation, not a reason to weaken or hardcode the shared platform behavior.

Required authorized action after deployment: open **Admin → Pengaturan → Inventaris Publik**, select **Hanya mobil bekas**, save, and verify the preview homepage/catalog. Do not change an unidentified dealer row.

## Remaining deployment prerequisites

1. Deploy the reviewed feature commit to the isolated preview environment through its established procedure.
2. Verify the Autoeighteen tenant identity before setting `USED_ONLY`.
3. Perform real browser/device QA at 320, 375, 390, 430, 768 and 1280px.
4. Confirm homepage, header search, catalog filtering, vehicle detail/related inventory, sitemap and metadata against the preview database.

## Verdict

**PASS WITH LIMITATIONS** — source, automated regression and production build pass. Browser QA and the live Autoeighteen `USED_ONLY` setting remain unverified deployment/UAT actions.
