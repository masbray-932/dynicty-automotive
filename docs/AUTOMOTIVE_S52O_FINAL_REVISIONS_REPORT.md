# Dynicty Automotive — S5.2O Final Customer Revisions

## Baseline

- Repository: `C:\Projects\dynicty-automotive`
- Branch: `feat/automotive-standalone-s5-2d-public-redesign`
- Starting local/remote HEAD: `abbb0c0a9d7708bd727d9c98e5a76e3e8f9bf7d5`
- PR #20: open, base `main`, unmerged, mergeable.
- Working tree was clean. Newer S5.2N work was preserved; no reset was performed.

## Existing implementation audit

Reused the existing `BannerCarousel`, catalog query contract, `inventoryMode`, WhatsApp components, dealer settings, secure upload services, CMS content editors, vehicle media manager, sales team editor, and brand editor. No duplicate search, inventory policy, CMS model, or upload backend was introduced.

## Revision status

### REV-01 — Smart media guidance: PASS

A single `mediaUploadSpecs` registry and reusable `MediaUploadField` now cover every existing image input: dealer logo, favicon, main banner, promo banner, vehicle photos, salesperson photos, brand logos, advantage icons, article/service images, and showroom photo. There is no separate mobile-hero upload in the current architecture, so none was invented.

Each field displays recommended dimensions/ratio, JPEG/PNG/WebP formats, the truthful 8 MiB backend limit, and composition guidance. Client selection reports actual dimensions and size, previews the local object URL before upload, warns non-blockingly for low resolution or ratio mismatch, and blocks unsupported MIME/oversized files through native validity. Existing server signature/decode, 25-megapixel, authorization, owner, and storage checks remain authoritative.

Recommendations follow actual rendering: hero 1920×820 (21:9), promo 1200×1600 (3:4), vehicle 1600×1200 (4:3), editorial/showroom 1600×900 (16:9), sales 800×1000 (4:5), brand logo 800×400, dealer logo 1024×341, favicon/advantage 512×512. CMS banner preview retains 390/768/1280 modes.

### REV-02 — Compact desktop hero: PASS by code and regression

Desktop uses `clamp(26.25rem, 36vw, 32.5rem)`, yielding a 420–520px design range. Mobile continues to adopt the banner's natural aspect ratio, keeps contain-fit artwork, and displays welcome copy below the image.

### REV-03 — Two-row header/search: PASS

Desktop row one contains transparent dealer logo, functional GET `/cars` search, optional condition selector, and existing WhatsApp CTA. Row two contains the existing navigation with pathname-derived active state. Mobile keeps logo/menu in the first row and search on its own full-width row. Enter and the search button submit existing `q`/`condition` parameters; all catalog filters remain compatible.

### REV-04 — White header: PASS

Header, desktop navigation, and mobile menu use white surfaces, dark text, subtle borders/shadow, and restrained `#C8102E` active/focus accents. Dealer branding tokens remain available elsewhere; Admin styling and the approved green WhatsApp UI are unchanged.

### REV-05 — Hero text left-center: PASS by code and regression

Desktop CMS welcome text is vertically centered and left-aligned at proportional 7vw padding with a left-to-right contrast overlay and responsive typography. Mobile copy remains separate below the image. No hardcoded welcome copy or new CTA was introduced.

### REV-06 — Used-only behavior: PASS WITH CONFIGURATION LIMITATION

The existing dealer-scoped `inventoryMode` is reused. `USED_ONLY` hides New Cars and the redundant condition selectors in header search, homepage search, and catalog filter, while submitting a hidden `condition=USED`. Server-side catalog/detail/related/homepage/stock/sitemap/metadata enforcement from S5.2N remains intact. Other dealers retain `BOTH`/`NEW_ONLY` behavior. No vehicle record was modified.

The local row is still `Dynicty Auto Demo`; Autoeighteen cannot be identified safely from local data. Its authorized Admin must set **Inventaris Publik → Hanya mobil bekas** after deployment.

## Files and schema

New shared files: `features/media/upload-specs.ts`, `components/admin/media-upload-field.tsx`, `components/public/header-vehicle-search.tsx`, `components/public/public-nav.tsx`.

Updated public/CMS components: header, hero carousel, homepage/catalog condition controls, dealer settings, content, vehicle image, editorial, sales-team, and brand editors. Focused S5.2N tests were reconciled and `tests/s52o-final-revisions.test.tsx` was added.

Prisma schema and migrations are unchanged in S5.2O. The existing S5.2N `inventoryMode` migration remains the only required schema prerequisite.

## Verification

- Prisma validate/generate: PASS
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- Focused S5.2O/S5.2N public tests: 54 passed
- Complete non-deployment suite: 51 files passed, 1 skipped; 524 passed, 5 skipped, 0 failed
- `pnpm build`: PASS
- Final `git diff --check`: PASS

The known Windows deployment harness limitation remains separate: seven symlink operations require privileges/Developer Mode and one LF assertion receives CRLF. Linux CI is authoritative for that workflow.

## Browser evidence

The local preview at `http://127.0.0.1:3000` was inspected in the in-app browser against the isolated demo environment:

- 390px: white responsive header, full-width search row, mobile navigation control, natural-ratio hero (156px image region), and 0px horizontal overflow.
- 768px: two-row header/navigation and search visible, compact 420px hero, and 0px horizontal overflow.
- 1280px: two-row header/navigation and search visible, compact 461px hero, and 0px horizontal overflow.
- `/cars`: `Beli Mobil` exposed as the active navigation destination; catalog loaded successfully with 0px horizontal overflow.
- Browser console: 0 warnings and 0 errors during the inspected flow.

The requested 375/430/1024/1440 widths were not separately captured in this run and are **NOT TESTED**; they remain part of preview/UAT verification. Source assertions are not substituted for those missing visual checks.

## Deployment and rollback

Before preview deployment: back up the preview database, apply committed migrations, set the verified Autoeighteen tenant to `USED_ONLY`, preserve uploads, and run the full viewport matrix. No production/staging database should be touched.

Rollback is application-only: the prior commit can continue using the additive S5.2N schema. Do not drop `inventoryMode`. S5.2O introduces no data migration or record rewrite.

## Verdict

**PASS WITH LIMITATIONS** — implementation and automated gates pass, and representative mobile/tablet/desktop browser checks pass. Live Autoeighteen `USED_ONLY` configuration plus the four untested viewport widths remain deployment/UAT prerequisites.
