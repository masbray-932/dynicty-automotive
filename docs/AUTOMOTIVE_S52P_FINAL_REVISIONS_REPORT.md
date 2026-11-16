# DYNICTY AUTOMOTIVE — S5.2P FINAL CUSTOMER REVISIONS REPORT

## Verified baseline

- Repository: `C:\Projects\dynicty-automotive`
- Branch: `feat/automotive-standalone-s5-2d-public-redesign`
- Local and remote baseline HEAD: `489d13bea1612868abde012602e8b982899abc30`
- PR #20 was verified open, unmerged, based on `main`, and pointed to the expected feature branch before implementation.
- The working tree was clean before implementation. No newer local work was reset, discarded, or overwritten.

## Root causes and implementation

### REV-01 — Leasing partner logo specification

The repeatable content editor selected `hero` only for main banners and reused the portrait `promo` specification for every other media kind. Consequently, leasing logos inherited the 1200 × 1600 portrait recommendation and preview behavior.

- Added a dedicated `leasingPartner` media specification: 600 × 240 px, 5:2.
- Preserved the existing JPEG, PNG, WebP and 8 MiB backend restrictions.
- Guidance now prefers transparent PNG/WebP and horizontal composition.
- Existing aspect-ratio mismatch behavior remains a non-blocking warning; valid portrait files are not rejected solely for their ratio.
- Added an aspect-aware upload preview and a dedicated 5:2 saved-media preview.
- Confirmed the public leasing presentation continues to use `object-contain`.
- Existing records, storage keys, dealer ownership and tenant isolation were not changed.

### REV-02 — Floating WhatsApp widget

The widget used a compact 48 px icon-only control, so it lacked the requested sales label and had limited visibility.

- Reworked only the floating variant into one accessible link containing a compact left label and a moderately larger icon area.
- Exact visible label: `Hubungi Sales Kami`.
- The complete label/icon surface opens the existing dealer-specific WhatsApp URL.
- Preserved enable/disable behavior, message construction, safe-area offsets, keyboard focus, external-link safety and reduced-motion behavior.
- Responsive dimensions are 52 px high on small screens and 58 px otherwise, with a viewport-safe maximum width.
- The separate WhatsApp CTA used by sales cards was not changed.

### REV-03 — Welcome typography controls

The dealer profile model previously stored welcome copy and publication state only; there were no tenant-scoped typography values.

- Added four nullable, tenant-owned `DealerContent` fields for desktop/mobile heading and description font sizes.
- Added bounded Admin controls with pixel units and desktop/mobile previews.
- Bounds: heading desktop 32–72 px, heading mobile 24–48 px, body desktop 14–24 px, body mobile 14–22 px.
- Blank values remain `null` and preserve the existing Tailwind typography defaults.
- Added matching Zod server validation and PostgreSQL check constraints.
- Values apply only to the homepage welcome heading/description and include break-word protection.
- Existing authorization, owner-row locking, confirmation behavior and server action flow remain in place.

Migration: `prisma/migrations/20261116000000_s52p_welcome_typography/migration.sql`. It is additive only: four nullable integer columns plus four check constraints. It contains no destructive statements and was not applied locally, to preview, or to production in this task.

### REV-04 — Responsive hero banner

The cropping came from the combination of an image ratio near 21:9, a fixed 420–520 px desktop container, and a breakpoint that changed the main image from `contain` to `cover`. At tablet/laptop widths the container and image ratios diverged, causing important artwork to be cropped.

- Main hero artwork now remains proportionally contained across breakpoints with the existing blurred cover layer filling otherwise empty space.
- This behavior is scoped to the main CMS hero; it does not globally force `object-contain` on unrelated media.
- Tablet height now uses `clamp(20rem,42vw,26.25rem)` and laptop/desktop uses `clamp(26.25rem,41vw,32.5rem)`, preserving a compact desktop range while reducing ratio mismatch.
- Preserved the left-center desktop welcome overlay, mobile image-first copy below the image, carousel navigation, autoplay/pause behavior, swipe/keyboard controls and reduced-motion behavior.

## Changed files

- `app/(public)/page.tsx`
- `components/admin/media-upload-field.tsx`
- `components/public/floating-whatsapp.tsx`
- `components/public/whatsapp-link.tsx`
- `features/admin/confirmation-policy.ts`
- `features/content/banner-carousel.tsx`
- `features/content/content-editor.tsx`
- `features/media/upload-specs.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20261116000000_s52p_welcome_typography/migration.sql`
- `server/content/actions.ts`
- `validation/dealer-content.ts`
- `tests/content-rendering.test.tsx`
- `tests/s52n-customer-revisions.test.tsx`
- `tests/s52n-premium-visual-refinement.test.tsx`
- `tests/stage4b1-image-rendering.test.tsx`
- `tests/s52p-final-revisions.test.tsx`
- `docs/AUTOMOTIVE_S52P_FINAL_REVISIONS_REPORT.md`

## Automated verification

- `pnpm prisma validate` with the repository's local environment-loading contract: PASS.
- `pnpm prisma generate`: PASS.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm build`: PASS; all 22 pages generated and route collection completed.
- Focused S5.2P/content regression: 22 passed, 0 failed.
- Non-deployment regression: 52 test files passed, 1 skipped; 531 tests passed, 5 skipped, 0 failed.
- `git diff --check`: PASS (Windows line-ending notices only; no whitespace errors).
- The deployment-only test file was intentionally excluded from the non-deployment run; no deployment action was performed.

## Browser QA

Localhost was opened in an actual browser and checked at 320, 375, 390, 430, 768, 1024, 1280 and 1440 px.

- Horizontal overflow: none at all eight widths (document width stayed within the viewport; the observed 15 px difference was the browser scrollbar gutter).
- Floating WhatsApp widget: visible at all eight widths, exact label present, responsive 192 px mobile / 225 px desktop total width, and positioned inside the configured safe-area offsets.
- Screenshots were inspected at all eight widths; navigation, category cards and widget remained responsive.
- Hero artwork and custom welcome font sizes: NOT VISUALLY TESTED. The isolated local database intentionally was not migrated during this task, so the new Prisma columns were absent. The content service logged `public.content_read_failed` and safely returned its fallback, leaving no active hero in the local page. Source/regression/build checks passed, but this is not claimed as a visual pass.
- No database migration was run to bypass this limitation.

## Remaining deployment prerequisites

1. Back up the target preview database.
2. Apply committed Prisma migrations, including `20261116000000_s52p_welcome_typography`, before starting the updated application.
3. Confirm the preview tenant has at least one active main banner and welcome copy, then repeat visual hero checks at tablet portrait/landscape and laptop widths.
4. Verify the Admin Sambutan controls persist and reload correctly against the migrated preview database.
5. Let GitHub Actions complete successfully for the final pushed commit.

## Final verdict

**PASS WITH LIMITATIONS**

All four requested revisions are implemented and automated checks pass. Browser responsiveness and the floating widget were verified at all requested widths. The hero and persistence portions remain visually unverified until the committed additive migration is applied to an isolated preview database.
