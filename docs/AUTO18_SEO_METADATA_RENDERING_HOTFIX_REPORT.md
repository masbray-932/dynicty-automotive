# Auto Eighteen — SEO metadata rendering hotfix

Audit date: 27 November 2026 (Asia/Jakarta).

| Item | Result |
|---|---|
| Verdict | **PASS WITH LIMITATIONS** — source/configuration hotfix validated locally; production deployment and post-deploy acceptance not performed |
| Repository | masbray-932/dynicty-automotive, verified origin |
| Actual main baseline | `874694938d73838e2ee71699f880171f860660e6` (PR #24 favicon conflict fix) |
| Initial local checkout | S5.2C branch `feat/automotive-standalone-s5-2c-public-website`, HEAD `1881b0a187f3e229b5802100bd4bc341326cb533`, clean |
| Implementation branch | `fix/auto18-seo-metadata-rendering`, isolated worktree from verified current origin/main |
| Execution health | Separate shell commands, fetch, inspection, builds and runtime tests completed without exec disconnection or unexpected state loss |
| Installed versions | Next 16.3.5, React 19.2.8, Prisma 6.19.0; no dependency changes |
| Commit / PR | Exact immutable delivery SHA and PR URL are provided in the final delivery and PR head metadata; this report belongs to that commit |

## Confirmed cause and interpretation

**The metadata is not completely missing.** Production full HTTP responses contain exactly one correct title and description. Normal browser and Googlebot user agents receive them after `</head>`; Twitterbot receives them inside `<head>`. This reproduces installed Next.js Streaming Metadata behavior, not a missing title/description generator.

Installed documentation `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` explicitly describes body-appended metadata for normal/render-capable agents, including Googlebot. `.../05-config/01-next-config-js/htmlLimitedBots.md` documents blocking metadata and `/.*/` as the supported all-agent switch. The installed default HTML-limited regex includes Twitterbot and Google-InspectionTool, but not plain Googlebot.

This is a mismatch with the requested **server-delivered head** contract, not proof Google cannot index the existing site. Actual Google indexing/Search Console rendering was not tested. The exact homepage strings already existed in source and production and are unchanged.

| Source audited | Finding |
|---|---|
| `app/layout.tsx` | Root title template/default and generic description; not duplicated in final complete response |
| `app/(public)/layout.tsx` | Async connection + dealer read supplies configured/favicon fallback metadata; inherited by public pages |
| `app/(public)/page.tsx::generateMetadata` | Async dealer lookup; expected fixed Auto Eighteen title/description passed to shared metadata helper |
| `server/editorial/metadata.ts::publicMetadata` | Absolute title, normalized description, trusted canonical, Open Graph/Twitter, robots; preserved |
| Public generateMetadata functions | Catalog depends on inventoryMode; vehicle detail remains ownership-qualified and dynamic; services/articles/about/contact/sell-car retain their existing behavior |
| `next.config.ts` before change | No htmlLimitedBots override; stock streaming behavior |
| Settings/schema | Dealer name, media, favicon, inventory mode and contacts affect existing presentation/metadata. No separate editable homepage SEO-title/description fields were identified; no such feature was invented or removed. |
| Cache/deployment evidence | Responses use no-store/no-cache and vary by UA rendering behavior. Source strings/favicon behavior match observed output. No evidence of a stale cache causing the issue. Exact deployed Git SHA is not exposed and therefore remains unverified. |

## Production audit — before only

Read-only complete compressed HTTPS responses were captured with curl (TLS verification enabled) for browser, Googlebot and Twitterbot user agents, at `/`, `/cars`, one actual AVAILABLE Mazda detail URL and `/about`. HTTP status was 200 throughout. Counts below parse real HTML tags rather than serialized React/Flight strings.

| Capture | Complete response title / description count | Location |
|---|---:|---|
| `about-browser.html` | 1 / 1 | streamed BODY |
| `about-googlebot.html` | 1 / 1 | streamed BODY |
| `about-twitterbot.html` | 1 / 1 | HEAD |
| `browser.html` | 1 / 1 | streamed BODY |
| `cars-browser.html` | 1 / 1 | streamed BODY |
| `cars-googlebot.html` | 1 / 1 | streamed BODY |
| `cars-twitterbot.html` | 1 / 1 | HEAD |
| `cars_mazda-mazda-3-hb-2-0-cc-2025-browser.html` | 1 / 1 | streamed BODY |
| `cars_mazda-mazda-3-hb-2-0-cc-2025-googlebot.html` | 1 / 1 | streamed BODY |
| `cars_mazda-mazda-3-hb-2-0-cc-2025-twitterbot.html` | 1 / 1 | HEAD |
| `googlebot.html` | 1 / 1 | streamed BODY |
| `twitterbot.html` | 1 / 1 | HEAD |

Expected and observed homepage title:

```text
Auto Eighteen - Pusat Jual Beli Mobil Bekas Berkualitas Dan Bergaransi
```

Expected and observed homepage description:

```text
Auto Eighteen adalah pusat jual beli mobil bekas berkualitas dan bergaransi. Melayani pembelian Cash, Credit & Trade In. Cari mobil impian Anda hanya di Auto18.
```

Canonical, OG/Twitter metadata, robots and `/auto-18-favicon.png` were present in the complete production homepage response. No duplicate or conflicting title/description was found. A separate headless Chromium production DOM attempt was **BLOCKED** by `ERR_CERT_AUTHORITY_INVALID` on the managed proxy trust path; certificate checks were not bypassed. This is not evidence the public site's certificate is invalid. Raw HTTPS production response audits succeeded with the managed CA trust.

## Minimal implementation and alternatives

| Option | Assessment |
|---|---|
| Change homepage text or add global title constants | Rejected: existing values already correct; would risk overriding other pages |
| Block only known crawlers | Insufficient: ordinary browser raw HTML would still fail the required head contract |
| Make only homepage metadata static | Insufficient: inherited async favicon/dealer metadata still participates; would not ensure head placement or preserve configurable media without restructuring |
| Private headers, manual head injection or route restructuring | Avoided: unnecessary complexity/duplication risk for a supported framework configuration |
| Supported `htmlLimitedBots: /.*/` | Chosen deliberately: head contract applies to all agents and affected public routes. Disables metadata streaming application-wide, including Admin metadata scheduling, while preserving existing dynamic generators and authorization. |

Only runtime configuration changes: add `htmlLimitedBots: /.*/` with a comment documenting scope and TTFB tradeoff. Existing SQL, reads, cache rules, authentication, Admin UI, business content and dynamic metadata definitions remain unchanged. The all-agent pattern also retains every previously HTML-limited bot.

## Before/after HTML evidence

Complete production/browser and local pre-fix responses have this placement (irrelevant markup omitted):

```html
<head>
  <!-- viewport, assets; no resolved title/description here -->
</head>
<body>
  <!-- page content -->
  <title>Auto Eighteen - Pusat Jual Beli Mobil Bekas Berkualitas Dan Bergaransi</title>
  <meta name="description" content="Auto Eighteen adalah pusat jual beli mobil bekas berkualitas dan bergaransi. Melayani pembelian Cash, Credit &amp; Trade In. Cari mobil impian Anda hanya di Auto18."/>
</body>
```

Local patched production build (not deployed) returns:

```html
<head>
  <title>Auto Eighteen - Pusat Jual Beli Mobil Bekas Berkualitas Dan Bergaransi</title>
  <meta name="description" content="Auto Eighteen adalah pusat jual beli mobil bekas berkualitas dan bergaransi. Melayani pembelian Cash, Credit &amp; Trade In. Cari mobil impian Anda hanya di Auto18."/>
  <!-- existing canonical, social, robots and favicon metadata -->
</head>
```

| Local route | Agent | Before head title / description | After head title / description |
|---|---|---:|---:|
| `/` | browser | 0 / 0 | 1 / 1 |
| `/` | googlebot | 0 / 0 | 1 / 1 |
| `/` | twitterbot | 1 / 1 | 1 / 1 |
| `/cars` | browser | 0 / 0 | 1 / 1 |
| `/cars` | googlebot | 0 / 0 | 1 / 1 |
| `/cars` | twitterbot | 1 / 1 | 1 / 1 |
| `/cars/seo-fixture-car` | browser | 0 / 0 | 1 / 1 |
| `/cars/seo-fixture-car` | googlebot | 0 / 0 | 1 / 1 |
| `/cars/seo-fixture-car` | twitterbot | 1 / 1 | 1 / 1 |

All nine complete before/after response pairs retained identical title, description, canonical, Open Graph, Twitter, robots and icon values. Non-homepage titles remained distinct and vehicle-specific.

## Validation and exact environment

| Check | Actual result |
|---|---|
| Baseline regression | 595 passed, 5 database cases skipped |
| Patched regression | **604 passed, 5 skipped, 0 failed**; 59 files passed, 1 integration file skipped |
| New tests | 9 cases: six agent policies, missing versus body-streamed metadata, real HTML tags versus Flight lookalikes/entity decoding, duplicate detection |
| Lint | PASS (`pnpm lint`) |
| Typecheck | PASS (`pnpm typecheck`) |
| Prisma Client generation | PASS; generation only, no database connection/migration/seed |
| Production build before / after | PASS (`pnpm build`, Next 16.3.5 webpack) |
| Production-mode HTTP rendering | PASS, 9 cases before + 9 after, real built Next server with browser/Googlebot/Twitterbot user agents |
| Local hydrated browser | PASS, Chromium 156 / Playwright 1.62.1; homepage/catalog/vehicle detail each 200 and one title/description in head; no page errors or hydration/React console errors |
| Metadata regression | PASS, all nine response pairs preserve values/social/canonical/robots/favicon |
| Database-backed integration | NOT RUN. Five opt-in DB cases skipped; migrations, seed, reset and cleanup forbidden by task |
| Live patched production verification | NOT RUN; no deployment authorized/performed |
| Whitespace / Git hygiene | PASS; only four relevant files; no env, credentials, uploads or build outputs included |

Production-mode local rendering used an **outside-repository, read-only in-memory Prisma adapter**. It supplies synthetic dealer/vehicle reads, rejects mutation methods and never connects to a database. The app's actual compiled layouts, homepage/catalog/detail metadata, configuration and rendering execute unchanged. This is rendering integration evidence, not PostgreSQL behavior or verification of real customer content. The synthetic catalog uses BOTH inventory mode while production currently renders its configured used-car wording; no production setting was changed.

The committed `scripts/verify-seo-metadata-head.mjs` checks full response tags, placement, uniqueness and metadata preservation against an operator-selected origin and existing AVAILABLE vehicle. `--audit` records pre-fix head placement without falsely treating body-streamed metadata as absent. Usage after an independently reviewed deployment:

```sh
SEO_HTTP_BASE_URL=https://autoeighteen.com \
SEO_HTTP_VEHICLE_PATH=/cars/mazda-mazda-3-hb-2-0-cc-2025 \
node scripts/verify-seo-metadata-head.mjs
```

The example vehicle was AVAILABLE during this audit; select a currently AVAILABLE vehicle if inventory changes.

## Performance assessment

| Local warm median (last 5 of 6 requests) | Before | After | Difference |
|---|---:|---:|---:|
| Response headers | 6.1 ms | 33.7 ms | **+27.6 ms** |
| Complete response | 62.7 ms | 60.9 ms | -1.8 ms (normal run noise) |

Adapter settings reads used a controlled 25 ms delay. Blocking moves the existing metadata wait before the first HTML bytes. It does not add source-level DB calls, client JavaScript, dependencies or persistent caching. Local complete-render time did not materially increase; **TTFB does increase** and can increase further with slow real dealer/favicon reads. These small local samples are not production LCP, load testing or a guarantee of negligible production latency. Reassess real TTFB/LCP after a separately authorized deployment; do not label unmeasured production performance PASS.

## Files changed

| File | Change |
|---|---|
| `next.config.ts` | Supported blocking metadata policy plus rationale |
| `scripts/verify-seo-metadata-head.mjs` | Read-only complete-response HTML/agent regression checker |
| `tests/seo-metadata-rendering.test.ts` | Focused policy/parser regressions |
| `docs/AUTO18_SEO_METADATA_RENDERING_HOTFIX_REPORT.md` | Audit, alternatives, HTML evidence, validation, performance tradeoff and limitations |

## Delivery and remaining gates

| Gate | Status |
|---|---|
| Source hotfix | Locally validated; ready for review with documented TTFB tradeoff |
| GitHub delivery | Feature branch commit and PR targeting main; exact SHA/URL in final delivery |
| CI | Report actual PR workflow state separately after publication; local checks do not imply CI success |
| Merge/deployment | Not performed |
| Production acceptance | Pending authorized deployment + repeat full-response audit and real latency observation |
| Data safety | No Preview/Production inventory, uploads, sales team, settings, dummy/inactive/placeholder content or credentials modified; no DB migrations/seed/reset/cleanup; no DNS/Nginx/SSL/VPS/env configuration changes |

Rollback is a reviewed revert of this configuration change; no database rollback is needed. It would restore stock streaming behavior, including body-appended metadata for normal browser/Googlebot agents. No destructive rollback commands were executed.
