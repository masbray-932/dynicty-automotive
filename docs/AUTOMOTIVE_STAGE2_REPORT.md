# Dynicty Automotive — Stage 2 Basic Dealer Completion

Tanggal: 8 Oktober 2026
Repository: `dynicty-automotive`
Baseline: `main` pada `69325e6c9e7a19c8e477e5420bf22e6ae70a959a` dan `docs/AUTOMOTIVE_STAGE1_AUDIT.md`

## Final status

**PASS WITH LIMITATIONS**

Implementasi source, regression tests, lint, typecheck, Prisma validation, Prisma Client generation, dan production build lulus. Migration tidak dijalankan karena tidak tersedia PostgreSQL lokal yang diizinkan untuk task ini. Browser/runtime DB pada 390 px, 768 px, dan 1280 px tidak dapat diverifikasi karena browser executable dan database lokal tidak tersedia. Tidak ada akses atau perubahan terhadap VPS, DNS, staging live, production, maupun database eksternal.

## Implemented features

### Homepage

- Premium main-banner carousel berbasis satu image per banner.
- Welcome title/body yang dapat diaktifkan dan diedit admin.
- Quick search mempertahankan condition, brand, model, dan keyword serta menambahkan minimum/maximum price.
- Promo banners terkelola dan ditampilkan sebagai banner image tanpa overlay.
- Homepage menampilkan maksimal enam kendaraan unik yang berstatus AVAILABLE dari kombinasi featured dan latest.
- About-us summary memakai record profile yang sama dengan `/about`.
- Advantages, leasing partner logos, FAQ, operating hours, contact, Maps, social links, WhatsApp, dan footer lengkap.
- Bagian opsional kosong atau nonaktif tidak dirender. Tidak ada klaim, promo, partner, atau isi dealer fiktif yang dibuat sebagai default.
- Opsi brand/model Homepage sekarang hanya berasal dari master data yang mempunyai kendaraan AVAILABLE.

### Premium banner

- Referensi source `sinar-telur-ecommerce` pada commit `b3647b3605437e503862df97331cb88a6bc11c92` berhasil dibaca. Implementasi mengadaptasi image-focus carousel, portrait classification, autoplay, visibility pause, keyboard, swipe, arrows, dan dots tanpa membawa platform code lain.
- Satu upload image digunakan untuk HP, tablet, dan desktop; tidak ada mobile override.
- Main banner dan promo banner mempunyai safe optional link, active state, dan numeric ordering.
- Maksimal lima main banner aktif dijaga di authenticated Server Action, dalam transaksi dengan row lock pada owner `DealerSettings/default`. Public resolver juga selalu membatasi hasil ke lima slide.
- Container memakai 2:1 di bawah 1280 px dan 21:9 mulai 1280 px.
- Landscape/square menggunakan `object-cover`. Source portrait menggunakan `object-contain` dengan blurred/dimmed backdrop dari image yang sama.
- Autoplay lima detik berhenti saat hover, focus, document hidden, reduced-motion, atau ketika pengguna memilih pause.
- Mendukung touch swipe, previous/next arrows, dots, dan Left/Right keyboard navigation.
- Navigation dan pause control tidak dirender untuk satu slide.
- Slide tidak mempunyai text/button overlay; optional link membungkus image dan memakai accessible label.
- Slide yang tidak aktif diberi `inert` dan `aria-hidden` agar link tersembunyi tidak masuk keyboard traversal.
- Admin preview memakai komponen renderer yang sama dengan public, dengan pilihan 390/768/1280 px.

### Company Profile

- Route `/about` ditambahkan dengan metadata, canonical, Open Graph, dan sitemap entry.
- Profile memakai satu sumber data untuk Homepage dan `/about`.
- Mendukung story, showroom photo dan alt text, factual advantages, optional operating hours, address, phone, email, Maps, WhatsApp dan catalog CTA.
- Jika about content belum aktif, isi company profile tidak difabrikasi.

### Admin CMS

- Route authenticated `/admin/content` ditambahkan ke navigation admin.
- Admin dapat mengelola welcome, about/showroom, operating hours, main banners, promo banners, advantages, FAQ, dan leasing partner logos.
- Semua create/update/delete Server Action memanggil `requireAdmin()` secara independen.
- Item mendukung active/inactive dan ordering. Delete memerlukan explicit confirmation.
- Validation dilakukan di server untuk panjang input, required fields, safe links, boolean state, ordering, dan upload.
- CMS membatasi maksimal 30 record per content kind untuk mencegah pertumbuhan query/admin page tanpa batas.

### Storage and mutation safety

- Reuse `StorageProvider`; tidak ada bypass filesystem atau exposure credential ke client.
- Media keys memakai namespace `dealers/default/content/<kind>/<uuid>.<ext>` dan filename dari pengguna tidak digunakan.
- JPEG/PNG/WEBP maksimum 8 MB tetap diperiksa dari MIME dan file signature.
- Next Server Action body limit menjadi 10 MB agar validator 8 MB benar-benar dapat dicapai; aplikasi tetap menolak file di atas batas validator.
- Replacement menyimpan DB reference terlebih dahulu, kemudian membersihkan media lama.
- Upload baru dibersihkan jika validation/DB transaction gagal.
- Setelah DB commit, kegagalan revalidation tidak menghapus media yang sudah direferensikan oleh DB.
- Cleanup media lama yang gagal menghasilkan warning aman dan meminta cleanup manual tanpa membatalkan DB state yang sudah benar.
- R2 upload/delete tidak diimplementasikan pada task ini; adapter tersebut memang masih merupakan stub dari fase sebelumnya.

## Database and migration

Additive Prisma migration:

- `prisma/migrations/20261008000000_stage_2_dealer_content/migration.sql`

Model baru:

- `DealerContent`: one-to-one terhadap `DealerSettings`, menyimpan welcome, profile, showroom, dan operating hours beserta visibility state.
- `DealerContentItem`: child record milik `DealerSettings` untuk main banner, promo banner, advantage, FAQ dan leasing partner.
- Enum `DealerContentKind`.

Migration hanya membuat enum, dua tabel, satu query index, dan foreign keys additive dengan `ON DELETE CASCADE`. Tidak ada drop/rename/destructive data operation. Tidak ada Tenant model. Migration belum diaplikasikan ke database mana pun sesuai guardrail.

## SEO, visibility, accessibility and security

- `/about` memakai canonical `/about` dan metadata faktual dari active about summary jika tersedia.
- Sitemap menambahkan `/about`; existing AVAILABLE-only vehicle entries tetap dipertahankan.
- Catalog/detail/related/public inventory query tidak dilonggarkan; DRAFT dan SOLD tetap tidak muncul public.
- Staging-wide `X-Robots-Tag` dan staging robots behavior pada existing config tidak diubah.
- CMS output dirender sebagai React text; tidak ada `dangerouslySetInnerHTML`.
- External link hanya menerima HTTPS tanpa embedded credentials; internal link harus diawali satu `/`. `javascript:`, `data:`, protocol-relative URL, HTTP, backslash/control-character redirect, dan encoded newline ditolak.
- Carousel mendukung focus ring, keyboard, touch target minimum, reduced motion, pause control, live focus safety, alt text, and hidden-slide isolation.
- Empty/inactive section tidak menghasilkan heading atau placeholder claim public.

## Changed files

### Added

- `app/(public)/about/page.tsx`
- `app/admin/(protected)/content/page.tsx`
- `features/content/banner-carousel.tsx`
- `features/content/content-editor.tsx`
- `features/content/domain.ts`
- `features/content/public-sections.tsx`
- `server/content/actions.ts`
- `server/content/service.ts`
- `validation/dealer-content.ts`
- `prisma/migrations/20261008000000_stage_2_dealer_content/migration.sql`
- `tests/content-actions.test.ts`
- `tests/content-pages.test.tsx`
- `tests/content-rendering.test.tsx`
- `tests/dealer-content.test.ts`
- `docs/AUTOMOTIVE_STAGE1_AUDIT.md` (Stage 1 deliverable already present in the starting worktree)
- `docs/AUTOMOTIVE_STAGE2_REPORT.md`

### Updated

- `app/(public)/layout.tsx`
- `app/(public)/page.tsx`
- `app/sitemap.ts`
- `components/admin/admin-nav.tsx`
- `components/public/site-footer.tsx`
- `components/public/site-header.tsx`
- `features/homepage/domain.ts`
- `features/homepage/quick-search.tsx`
- `next.config.ts`
- `prisma/schema.prisma`
- `server/homepage/service.ts`
- `server/settings/actions.ts`
- `services/storage/key.ts`

## Regression tests added

- Banner landscape/portrait fit and exact responsive ratios.
- Link allow/deny cases including unsafe schemes, credentials, encoded newline and proxy-style escapes.
- Active/empty/unsafe item visibility, deterministic ordering and public five-slide cap.
- Required FAQ/advantage body and inactive empty profile behavior.
- Owner-scoped media key safety.
- Homepage minimum/maximum price flow into existing catalog parser.
- Independent authorization gate on every new mutation.
- Sixth active main-banner rejection under owner lock.
- Upload signature rejection before DB writes.
- Owner/kind constrained item lookup.
- Upload compensation and old-media cleanup order.
- Safe handling of cleanup and revalidation failures.
- Explicit delete confirmation and delete/media cleanup order.
- Empty optional section SSR behavior.
- Single/multiple banner navigation behavior and inactive slide isolation.
- No banner text/button overlay.
- FAQ HTML escaping.
- Homepage agreed section wiring, maximum six vehicle cards, search fields, and WhatsApp link.
- `/about` shared content, factual advantages, operating hours, catalog CTA, metadata and canonical.
- Existing AVAILABLE-only Homepage/catalog/detail/sitemap tests remain passing.

Tests use pure domain checks, server rendering, and mocked service boundaries where no PostgreSQL is available. They do not pretend to be PostgreSQL or browser integration tests.

## Commands and results

| Command | Result |
| --- | --- |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 14 test files, 80 tests |
| `pnpm exec prisma validate` with non-secret local-format placeholder URL | PASS |
| `pnpm db:generate` | PASS — Prisma Client 6.19.0 |
| `DEPLOYMENT_ENV=staging NEXT_PUBLIC_SITE_URL=https://automotive-preview.dynicty.com pnpm build` | PASS |
| `git diff --check` | PASS |
| External database migration/seed | NOT RUN |
| Browser QA at 390/768/1280 | NOT RUN — local browser executable unavailable |
| VPS/DNS/live staging/production | NOT TOUCHED |

Build output includes dynamic routes `/`, `/about`, `/admin/content`, `/cars`, `/cars/[slug]` and existing admin routes. `/robots.txt` remains generated as before.

## Remaining limitations and blockers

1. A real isolated PostgreSQL instance is required to run `prisma migrate deploy`, verify schema objects/row lock behavior, and test CMS persistence. Source/schema validation is not DB verification.
2. Responsive behavior is implemented and covered by renderer/domain tests, but actual browser QA at 390/768/1280 px is still required. Swipe, image natural dimensions, focus behavior, layout overflow and visual quality require real interaction testing.
3. Production R2 remains blocked because the pre-existing `R2StorageProvider.put/delete` methods still throw. Local storage works only where current environment policy permits it. Stage 2 did not expand into R2 implementation.
4. The admin preview uses the same renderer, but true WYSIWYG depends on the uploaded image being retrievable from the configured storage provider.
5. No content was seeded. The public site intentionally hides optional sections until an administrator supplies factual dealer data and media.
6. Ordering uses explicit numeric values rather than drag-and-drop. This satisfies ordering behavior without adding a UI dependency; duplicate numbers use stable ID ordering.
7. The max-five active rule is guaranteed through the CMS transaction and enforced again at public projection, not through a PostgreSQL CHECK constraint because aggregate row-count limits cannot be expressed as a simple row constraint.
8. Reference behavior was source-reviewed at the named commit, but cross-application pixel parity was not claimed or browser-certified.

## Readiness for Stage 3

Stage 2 source is ready for Stage 3 only after these gates are performed against an isolated local/staging environment:

1. Review the uncommitted diff and migration.
2. Apply the real migration using `prisma migrate deploy`; never use `db push` or reset an existing DB.
3. Exercise admin content create/edit/activate/order/delete and verify media compensation.
4. Complete browser QA at 390/768/1280 px, including 0/1/5 slides, landscape and portrait uploads, swipe, keyboard, reduced motion, and external/internal links.
5. Verify Homepage and `/about`, AVAILABLE-only inventory, SEO output, sitemap, staging noindex, contact links, console and CSP.
6. Either keep isolated staging local media with persistent storage or complete and verify R2 before any production claim.

Stage 3 has not been started. No commit or push was created.
