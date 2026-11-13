# Dynicty Automotive — S5.2N Customer Revisions Report

## 1. Baseline and branch

- Repository: `C:\Projects\dynicty-automotive`
- GitHub: `masbray-932/dynicty-automotive`
- Branch: `feat/automotive-standalone-s5-2d-public-redesign`
- Verified baseline before implementation: `ae4d845781ca73f9ffb13f757c8ea5c033d8c3c7`
- Working tree was clean before implementation.
- Existing PR: #20, targeting `main` (remote state must be rechecked immediately before push).
- No production, staging, preview VPS, or production data was accessed or modified.

## 2. Revision status

### REV-001 — Responsive hero banner: PASS

- Desktop keeps CMS-configured copy as an image overlay.
- At 390 px the image is rendered first with `object-contain`; title and description render in a separate white block below it.
- Mobile has no text overlay and no horizontal overflow.
- Tablet/desktop retain the cinematic overlay.

### REV-002 — Header brand color: PASS

- The public header uses the dealer primary color only when white text meets WCAG AA contrast.
- The documented fallback is dark red `#7F1D1D` when the configured color is absent, invalid, or too light.
- The demo dealer's configured `#C8102E` passes contrast and rendered as `rgb(200, 16, 46)`.
- Page, card, and form surfaces remain white. Admin styling is unchanged.

### REV-003 — WhatsApp CTA color: PASS

- A shared green treatment (`#25D366`, dark readable foreground, hover and focus states) is used by the header, dealer contact, sales cards, vehicle detail, sell-car flow, and floating widget.
- Non-WhatsApp actions retain their existing colors.

### REV-004 — Floating WhatsApp: PASS

- Reuses the authoritative `DealerSettings.whatsappNumber`.
- Adds `whatsappWidgetEnabled` and optional `whatsappWidgetMessage` settings.
- Phone normalization and encoded initial-message handling are tested.
- Invalid/missing numbers hide the widget safely.
- Mobile safe-area spacing and a raised mobile position avoid the vehicle-detail sticky CTA.

### REV-005 — Dealer favicon: PASS

- Adds dealer-scoped favicon upload, preview, replacement, and removal to Admin settings.
- Uses existing authorization, raster signature/decode validation, storage provider, owner-row locking, compensating cleanup, and revalidation.
- Uploaded pixels are re-encoded as a 192×192 WebP with a unique storage key; original bytes and metadata are not published.
- Public metadata uses the dealer favicon when configured and `/favicon.ico` otherwise.
- Unique replacement URLs avoid stale favicon caching.

### REV-006 — Stock summary: PASS WITH DOCUMENTED LIMITATION

- Count is the number of dealer-scoped public vehicles whose status is exactly `AVAILABLE`; draft and sold records are excluded by the shared storefront scope.
- Last update is the newest `Car.updatedAt` among those eligible records, formatted in Indonesian using `Asia/Jakarta`.
- Empty inventory and missing history have explicit copy.
- Limitation: the current schema cannot distinguish a stock-status change from another edit to an available vehicle. The smallest maintainable implementation therefore uses `Car.updatedAt` and documents that semantic.

### REV-007 — Six dealer advantages: PASS

- Reuses the existing `DealerContentItem` `ADVANTAGE` CMS.
- Supports title, factual body, approved built-in icon, optional custom raster icon, ordering, and active status.
- Server-side owner locking rejects a seventh active card.
- Custom icons use the existing validated content-media upload and cleanup path.
- Existing records remain compatible; no default records were fabricated.

### REV-008 — Promotional banner slider: PASS

- Reuses `PROMO_BANNER` records and existing Admin upload/link/order/active/delete flows.
- Portrait slider renders before the brand grid on mobile/tablet and to its left on desktop.
- Supports previous/next, pagination, autoplay, explicit pause, pause after user navigation, keyboard/swipe navigation, document visibility, and reduced-motion preference.
- Optional validated destination links are active only for the promo variant; the main hero remains non-promotional.
- Artwork uses contain-fit with a blurred background and is never stretched.
- The public section hides gracefully if both promo and brand data are empty.

### REV-009 — Google Reviews: ON HOLD AS REQUIRED

No Google OAuth, Business Profile API integration, automated synchronization, Google branding, or fabricated reviews were added. Existing manual testimonials are unchanged.

## 3. Files changed

Application and schema:

- `app/(public)/cars/[slug]/page.tsx`
- `app/(public)/layout.tsx`
- `app/(public)/page.tsx`
- `app/admin/(protected)/settings/page.tsx`
- `components/public/floating-whatsapp.tsx`
- `components/public/site-header.tsx`
- `components/public/whatsapp-link.tsx`
- `features/admin/confirmation-policy.ts`
- `features/content/banner-carousel.tsx`
- `features/content/content-editor.tsx`
- `features/content/domain.ts`
- `features/content/public-sections.tsx`
- `features/homepage/domain.ts`
- `features/sales-team/public-sales-team.tsx`
- `features/sell-car/inquiry-form.tsx`
- `features/settings/dealer-settings-form.tsx`
- `features/theme/domain.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20261113000000_s52n_customer_revisions/migration.sql`
- `server/content/actions.ts`
- `server/homepage/service.ts`
- `server/settings/actions.ts`
- `server/settings/branding.ts`
- `server/settings/logo-url.ts`
- `server/settings/service.ts`
- `services/storage/key.ts`
- `validation/dealer-settings.ts`

Tests and documentation:

- `tests/content-actions.test.ts`
- `tests/content-pages.test.tsx`
- `tests/content-rendering.test.tsx`
- `tests/dealer-branding-protection.test.tsx`
- `tests/s52n-customer-revisions.test.tsx`
- `tests/standalone-branding.test.ts`
- `docs/AUTOMOTIVE_S52N_CUSTOMER_REVISIONS_REPORT.md`

## 4. Database and schema

Migration `20261113000000_s52n_customer_revisions` adds three additive columns to `DealerSettings`:

- `faviconStorageKey TEXT NULL`
- `whatsappWidgetEnabled BOOLEAN NOT NULL DEFAULT true`
- `whatsappWidgetMessage VARCHAR(500) NOT NULL DEFAULT ''`

The migration does not delete or rewrite existing dealer, CMS, inventory, media, or authentication data. It was applied only to the previously isolated local database `dynicty_automotive_demo_s52e` at `127.0.0.1:5432`; all nine local migrations are applied. It was not applied to preview, staging, or production.

## 5. Verification results

Commands executed:

```text
pnpm prisma validate
pnpm prisma generate
pnpm lint
pnpm typecheck
pnpm exec vitest run tests/s52n-customer-revisions.test.tsx ...focused suites...
pnpm exec vitest run --exclude tests/standalone-deployment.test.ts
pnpm test
pnpm build
git diff --check
```

Results:

- Prisma schema validation: PASS
- Prisma client generation: PASS
- ESLint: PASS
- TypeScript: PASS
- Focused S5.2N/CMS/upload/branding tests: 88 passed, 0 failed
- All non-deployment tests: 516 passed, 5 skipped, 0 failed
- Full Windows suite: 524 passed, 5 skipped, 8 deployment-only failures
- Production build: PASS; all public and Admin routes compiled
- `git diff --check`: PASS

The eight full-suite failures are pre-existing Windows-only deployment harness constraints: seven tests cannot create Unix-style symlinks (`EPERM`), and one assertion compares LF with generated CRLF. No application regression failed.

## 6. Browser verification

Actual browser automation opened `http://127.0.0.1:3000/` against the local demo database after the migration.

| Viewport | Hero behavior | Promo/brand layout | Horizontal overflow |
| --- | --- | --- | --- |
| 390×900 | image contain; overlay hidden; copy below | promo first, then brands; 342×427 promo | 0 px |
| 768×900 | desktop overlay; mobile copy hidden | promo first, capped at 446×558; brands below | 0 px |
| 1280×900 | desktop overlay; mobile copy hidden | portrait promo left of brands; 397×530 promo | 0 px |

Additional browser evidence:

- Header rendered the configured contrast-safe dark red.
- Every rendered WhatsApp contact CTA with a button surface used `rgb(37, 211, 102)`.
- Floating widget was visible, safe-area offset, and used the configured normalized number.
- Promo next control changed the current slide and stopped automatic rotation until resumed.
- Mobile navigation opened and remained overflow-free.
- Stock summary rendered `14 mobil tersedia · Diperbarui 10 November 2026` from the local demo records.
- Default favicon links rendered because the demo dealer has no custom favicon yet.
- Browser console warnings/errors: 0.
- Reduced-motion behavior is covered by `matchMedia`/`motion-reduce` implementation and regression assertions; the automation browser itself did not advertise reduced motion.

Admin upload/CRUD behavior was verified through focused authorization, owner-lock, validation, upload, cleanup, and rendering tests. A live authenticated Admin mutation was not performed because this implementation task did not authorize changing demo CMS/settings records.

## 7. Known limitations

1. Inventory `updatedAt` is the best available stock-update timestamp; the schema has no dedicated inventory-event timestamp.
2. The local demo dealer has no uploaded favicon or custom advantage icon, so the live browser verified the platform fallback while upload/replace/remove behavior was verified by automated tests.
3. Windows cannot execute the Linux symlink deployment harness without Developer Mode/elevated symlink rights; Linux CI remains the authoritative deployment-test environment.
4. Google Reviews integration remains intentionally on hold.

## 8. Deployment prerequisites

1. Deploy the exact reviewed branch commit; do not merge or deploy an unverified working tree.
2. Back up the target preview database and record its current migration history.
3. Confirm target environment identity and isolation before any write.
4. Run committed migrations with `prisma migrate deploy` before starting the new application build.
5. Confirm the persistent uploads directory is writable by the service account and survives releases.
6. Verify required settings/environment names without printing secret values.
7. Restart only the preview application service, then smoke-test metadata/favicon, homepage, catalog, vehicle detail, Admin settings, uploads, and rollback.

## 9. Rollback considerations

- Application rollback is backward-compatible with the additive database columns; the prior release ignores them.
- Do not drop the new columns during an emergency application rollback.
- If a later deliberate schema rollback is required, first remove all application dependencies, back up the database, inventory favicon media keys, and then use a separately reviewed down procedure.
- Replaced favicon/custom-icon files are cleaned only after the new database reference commits; cleanup failures are reported as warnings and never roll back a successful reference.

## 10. Final verdict

**PASS WITH LIMITATIONS**

All eight approved revisions are implemented and locally verified. The limitations are the documented stock-timestamp precision, unavailable live Admin mutation/fresh custom media in the demo data, and known Windows-only deployment harness failures. None is an application release blocker when Linux CI and preview migration checks pass.
