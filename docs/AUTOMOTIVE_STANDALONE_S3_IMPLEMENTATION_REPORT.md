# Dynicty Automotive — Stage S3: Standalone Admin and branding

**Verdict: PASS WITH LIMITATIONS.** Operator settings, branding and CMS worked through the built app against disposable PostgreSQL. Interactive browser, customer HTTPS/ingress and durable media hosting are still release gates.

| Baseline | Evidence |
|---|---|
| Repository and main | GitHub and fetched `masbray-932/dynicty-automotive` `main` at `e97eb338409670851192af9f87c75ad9cc9f2921` (merge of PR #13), exactly the expected SHA. |
| Audit | Reviewed S2 report and installation contract, existing settings UI/actions/service, theme and public header/footer/metadata, CMS editors and services, Admin guards/authorization/session, dashboard and inventory paths, upload/storage, Prisma ownership and tests. No other checkout was modified. |

| Area | Verified behavior and changes |
|---|---|
| Existing Admin workflows | Dashboard, car list/new/edit, brands/models, Settings and CMS loaded as an authenticated Admin; unauthenticated requests did not receive Settings controls. Database service checks exercised vehicle create/update/delete, foreign/mixed ownership denial, image upload, reorder, primary change and fallback, byte cleanup and taxonomy mutation denial. No inventory, taxonomy, authentication/session or confirmation component rewrite. |
| Operational dealer profile | The existing form already writes showroom name, phone, WhatsApp, email, address, Google Maps, Instagram and Facebook. The built HTTP action saved all eight; public identity, address and WhatsApp were checked. The generic form still rejects branding and arbitrary fields. |
| Missing branding workflow | Replaced the read-only logo preview with separately confirmed forms for colors, logo upload/replacement and logo removal. Existing dialogs are retained. The dedicated standalone permission applies only to a legacy dealer admin and never grants platform branding authority. Existing generic logo actions stay denied. Each new Server Action and service requires authorization, and reads/writes target only the unowned legacy settings row. |
| Color handling | Each value is blank (reset) or six-digit hex, normalized on the server; arbitrary CSS, dealer IDs, duplicate/unexpected form fields are rejected. Primary uses existing storefront brand tokens. Secondary had no effect before S3; it now supplies the storefront focus indicator with a contrast-safe fallback. The Admin/root theme remains fixed. |
| Logo handling | Accepts static JPEG, PNG and WebP through the existing signature/decode/size/pixel checks. Re-encodes oriented raster pixels as WebP, up to 1024 px per side without enlarging, and assigns a random key under `dealer/logo/`. No supplied filename, storage key or SVG bytes become public content. Locks the legacy row during replacement/removal, cleans the old owned namespace key after commit, and compensates the new asset when persistence fails. Unsafe legacy key shapes are neither served nor removed; imported legacy assets outside the supported namespace/extension require operator review. |
| CMS | Existing editors/actions already support main banner, promo, About/welcome/showroom image, FAQ, advantages, leasing partners and operating hours. Verified the principal CMS flows through real HTTP submissions and public reads; inactive FAQ stayed hidden. No extra CMS module or schema change. |
| Storefront and SEO | Branding mutations use existing Settings route/layout revalidation. Fresh built HTTP responses displayed new branding, color/focus tokens, logo in header and Open Graph, and restored defaults after reset/removal. The configured canonical origin did not change when supplied an untrusted forwarding header. |

| Validation | Result |
|---|---|
| Prisma validate and Client generation | PASS, Prisma 6.19.0. |
| ESLint, Next route type generation, TypeScript, Git whitespace | PASS. |
| Vitest | PASS: **407 tests in 35 files**, including 9 added branding cases. Database and framework boundaries in these unit tests are mocked; raster decoding uses Sharp. |
| Production build | PASS, Next.js 16.3.5 webpack with synthetic standalone configuration. |
| Real PostgreSQL | PASS, native **17.11** in a loopback-only disposable cluster. All six unchanged migrations applied; status up to date. Fixture had 22 cars including legacy, two synthetic registered dealers and mixed-owner rows. Existing primary-admin concurrency/rotation and Admin scoped CRUD/media regression passed. |
| Built HTTP and actual Server Actions | PASS. Real login returned a Secure/HttpOnly/SameSite=Lax session cookie; authenticated Admin pages rendered. Actual multipart requests tested denied anonymous/foreign-origin writes, invalid colors/SVG/extra fields, valid profile and branding writes, WebP disk bytes and physical cleanup, actual CMS publication, and registered-linked default-row denial with cleanup of a rejected upload. HTTP checks were not interactive browser tests. |
| Browser and deployed infrastructure | NOT VERIFIED. Confirm desktop/mobile dialog flows, focus visibility and logo rendering in a browser. Verify customer HTTPS/allowlist, media mount and direct upload serving after an upload (including restart), and coordinated backup/restore before commercial release. R2 writes remain unavailable; public media paths do not authorize access to file bytes. |

| Changed files | Purpose |
|---|---|
| `app/admin/(protected)/settings/page.tsx`, `features/settings/dealer-settings-form.tsx` | Existing Settings page gains separate, confirmed branding forms. |
| `server/auth/authorization.ts`, `server/settings/{actions,branding,logo-url,service}.ts`, `validation/dealer-branding.ts`, `services/storage/key.ts` | Legacy-only authorization, validated mutations, logo processing and key checks. |
| `app/(public)/layout.tsx`, `features/theme/domain.ts`, `server/homepage/service.ts` | Public color/focus and safe logo integration. |
| `tests/standalone-branding.test.ts`, `tests/dealer-branding-protection.test.tsx`, `tests/stage4b1-form-ui.test.tsx`, `tests/theme-foundation.test.tsx` | New branding and updated settings/theme regressions. |
| `docs/AUTOMOTIVE_STANDALONE_INSTALLATION.md`, `docs/AUTOMOTIVE_STANDALONE_S3_IMPLEMENTATION_REPORT.md` | Operator workflow and verification record. |

No schema or migration change, production/staging data access, deployment, Dynicty integration, or dealer activation.
