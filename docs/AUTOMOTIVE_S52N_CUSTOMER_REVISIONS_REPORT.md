# Dynicty Automotive — S5.2N Final Customer Design Revision

## 1. Repository and baseline

- Repository: `C:\Projects\dynicty-automotive`
- Branch: `feat/automotive-standalone-s5-2d-public-redesign`
- Starting HEAD: `2e08d0d579a9138acaeeadc9c2427fb2eb79338f`
- Preview reference SHA `ae4d845781ca73f9ffb13f757c8ea5c033d8c3c7` was not used to reset newer work.
- Working tree was clean and the remote feature branch matched local HEAD before implementation.
- PR #20 was open against `main`. No preview, staging, or production resource was modified.

## 2. Revision status

### REV-001 / REV-001A — Hero: PASS by implementation and regression

Mobile no longer inherits a fixed `16rem–24rem` hero height. It starts at a safe 21:9 ratio and adopts the first banner's actual `naturalWidth / naturalHeight` after load. The blurred desktop filler is hidden on mobile, artwork remains `object-contain`, and welcome copy remains below the image. Desktop keeps its cinematic height and overlaid copy.

Root cause: fixed mobile height plus contain-fit artwork and a blurred absolute filler created the empty/dark bands around wide artwork.

### REV-002 — Header gradient: PASS

The dealer primary token selects the approved Autoeighteen gradient when configured as `#C8102E`: `linear-gradient(110deg, #650B16 0%, #990015 55%, #C90016 100%)`. Desktop header and mobile navigation share it; other dealers retain independently derived surfaces.

### REV-003 — Transparent logo: PASS

The public logo wrapper no longer adds a white background or padding. The existing Autoeighteen WebP was inspected: 1024×341, four channels, alpha range 0–255, transparent corners. No replacement identity was generated. Admin upload remains intact.

### REV-004 — Primary WhatsApp CTA: PASS

The shared CTA reproduces `auto18-whatsapp-button.zip`: 54px minimum height, 10px radius, exact 105-degree green gradient, 54px translucent icon block, supplied SVG, canonical shadow, hover/focus/reduced-motion behavior, and mobile spacing. Header, dealer contact, sales cards, vehicle detail, and sell-car actions reuse it without replacing configured numbers.

### REV-005 — Floating WhatsApp widget: PASS

The widget reproduces `auto18-whatsapp-widget.zip`: 48×48 desktop, 46×46 at ≤600px, exact 145-degree gradient, 15/14px radius, supplied filled SVG, subtle border/shadow, safe-area offsets, focus state, and no glow, pulse, or floating label. Existing enable/message/number settings remain authoritative.

### REV-006 — Dealer-scoped inventory mode: PASS WITH CONFIGURATION LIMITATION

`DealerSettings.inventoryMode` supports `BOTH`, `USED_ONLY`, and `NEW_ONLY`, defaulting to `BOTH`. It constrains homepage inventory/count/date, brand counts/models, quick search, catalog options/results, vehicle detail, related vehicles, sitemap, metadata, and copy. Direct `condition=NEW` requests are overridden by a used-only policy. Admin Settings exposes the tenant-scoped control; records are never deleted.

The local row is `Dynicty Auto Demo`, not an identifiable Autoeighteen tenant, so it was not changed. After migration, an authorized Autoeighteen administrator must select **Inventaris Publik → Hanya mobil bekas**.

### REV-007 — Centered inventory section: PASS

The section now has a centered dealer-derived eyebrow, restrained red divider, inventory-mode supporting copy, centered summary/actions, and unchanged vehicle cards/prices/sorting.

### REV-008 — Previously approved features: PASS by code/regression

Responsive hero/CMS welcome copy, per-dealer branding/favicon, configured WhatsApp/widget, eligible stock summary, six CMS advantages, and portrait promo slider with responsive brand grid remain preserved. Stock summary now also respects inventory mode.

### REV-009 — Google Reviews: ON HOLD

No Google OAuth/API, fabricated reviews, or Google branding was added. Manual testimonials are unchanged.

## 3. Schema, migration, and rollback

Migration `20261114000000_s52n_inventory_mode` creates enum `InventoryMode` and adds non-null `DealerSettings.inventoryMode` with default `BOTH`. It is additive and does not rewrite inventory or CMS data.

It was applied only to the verified isolated local database `dynicty_automotive_demo_s52e` at `127.0.0.1:5432`, after creating and reading a PostgreSQL custom-format backup in the local temporary directory. Ten migrations are now applied locally. Preview, staging, and production were untouched.

The prior app can ignore this column during application rollback. Do not drop it during an emergency rollback; any schema rollback needs a separate reviewed procedure and database backup.

## 4. Changed files

Public UI/domain: `app/(public)/page.tsx`, `app/(public)/cars/page.tsx`, `components/public/{site-header,floating-whatsapp,whatsapp-icon,whatsapp-link}.tsx`, `features/content/banner-carousel.tsx`, `features/homepage/{domain,quick-search}.tsx`, `features/catalog/{domain,catalog-controls}.tsx`, `features/sell-car/inquiry-form.tsx`, `features/theme/domain.ts`.

Settings/server: `features/settings/dealer-settings-form.tsx`, `features/admin/confirmation-policy.ts`, `validation/dealer-settings.ts`, `server/settings/{actions,service}.ts`, `server/{homepage,catalog,car-detail}/service.ts`.

Schema/tests/docs: `prisma/schema.prisma`, the new migration, four focused regression files, and this report.

## 5. Verification

- Prisma validate/generate: PASS
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- `pnpm build`: PASS
- Focused S5.2N/settings/authorization: 33 passed; follow-up regression recheck: 53 passed
- Non-deployment suite: 50 files passed, 1 skipped; 520 tests passed, 5 skipped, 0 failed
- Full Windows suite: 524 passed, 5 skipped, 8 deployment-harness failures (7 symlink `EPERM`, 1 expected LF versus generated CRLF)
- Local HTTP `/` and `/cars`: 200
- `git diff --check`: required and rerun before commit

## 6. Browser verification and evidence

The existing preview was inspected before implementation and showed the old flat header and white logo wrapper. The local server ran at `http://127.0.0.1:3000`, but final Computer Use could not safely bind Windows Chrome to a verified URL, while the in-app browser cannot reach Windows loopback. Therefore rendered 375/390/430/768/1280 screenshots, overflow measurements, and console checks are **NOT TESTED**. Responsive contracts are covered by SSR/source assertions, regression tests, build, and HTTP smoke checks, but are not claimed as visual PASS.

## 7. Deployment prerequisites

1. Back up the preview database and run committed migrations with `prisma migrate deploy` before starting the new build.
2. Identify Autoeighteen through the authorized Admin UI and set `inventoryMode=USED_ONLY`; never update a guessed tenant row.
3. Confirm the primary token is `#C8102E` and the transparent logo remains selected.
4. Run viewport QA at 375, 390, 430, 768, and 1280px, including overflow, navigation, CTA/widget focus, and console checks.
5. Verify `condition=NEW` is unavailable for Autoeighteen while a different `BOTH` tenant remains unaffected.
6. Keep persistent uploads and the existing rollback procedure unchanged.

## 8. Final verdict

**PASS WITH LIMITATIONS**

Implementation, schema, automated regression, build, and local HTTP checks pass. Remaining limitations are the intentionally unmodified Autoeighteen tenant setting and unavailable final browser viewport evidence. No merge or deployment was performed.
