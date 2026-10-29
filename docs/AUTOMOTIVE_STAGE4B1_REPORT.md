# DYNICTY AUTOMOTIVE — Stage 4B.1 Cumulative Bug Fix

Date: 26 October 2026 (UTC+07:00). Final certification: **PASS WITH LIMITATIONS**.

## 1. Baseline verification and preservation

| Check | Result |
| --- | --- |
| Repository / branch | masbray-932/dynicty-automotive / main |
| HEAD / local origin/main / patch baseline | 69325e6c9e7a19c8e477e5420bf22e6ae70a959a |
| Initial working tree | 31 modified tracked files, 25 untracked files, empty Git staging index |
| Actual prerequisite | Baseline plus complete uncommitted Stage 1–3B and Stage 3C, plus Stage 4A audit report |
| Completeness proof | All 178 Stage 1–3C files matched Git blob hashes from baseline and cumulative/incremental patch metadata before editing; no missing implementation was reconstructed |
| Stage 3A | Read-only audit stage; no separate application implementation expected |
| Preservation snapshot | All 179 initial files copied outside the repository before implementation; no initial file removed |
| Stage 2 migration | 20261008000000_stage_2_dealer_content retained in cumulative export; no new migration and none executed |
| Auth preservation | Protected page/layout guards, service checks, fifteen protected Server Actions and Stage 3C regression tests retained |
| Original index | Unchanged throughout implementation/export; no staging, commits or pushes in original repository |
| Infrastructure | No VPS, service, Nginx, DNS, deployment or live database changes |

## 2. QA findings and fixes

| ID | Root cause / supplied evidence | Source implementation | Certification boundary |
| --- | --- | --- | --- |
| BUG-C-001 | React form actions reset uncontrolled fields after normal validation-error results | Vehicle fields now controlled by a single persistent draft; dependent model cleared only when brand changes; field errors and server validation retained; operational failure no longer appears green by default | Source and component-wiring regression PASS; real browser validation flow not executed |
| BUG-C-002 | Unsafe double-dot sequences retained in generated car filenames; weak signature-only checks; opaque provider/DB errors. Operator reports historical HTTP 413 for about 1.57/1.75 MB requests | Generated keys normalize dot runs and validate suffixes, with MIME-derived extension at upload boundary; full decoder validation; 8 MiB bound retained; safe error-code logging and Indonesian feedback; partial put and failed transaction cleanup attempted | Source PASS. Historical Nginx request-limit failure remains BLOCKED until a separately authorized infrastructure change |
| BUG-C-003 | Operator reports raw media 200 but optimizer 400; admin already bypassed optimizer while public relative URLs did not | Central image-delivery helper bypasses optimizer only for persistent /uploads/, existing remote media and blob previews. Applied to cards, gallery hero/thumbnails, CMS banners/showroom/partners and shared dealer logos. Static raster assets retain optimizer | Actual Next Image HTML regression PASS; deployed image URLs/browser rendering not verified here |
| BUG-D-001 | Existing-brand Save directly invoked authorized mutation | Native browser confirmation displays original and trimmed proposed name. Cancel prevents submit; create/unchanged names do not prompt; pending guard prevents duplicate dispatch. Existing Server Action/validation retained | Confirmation decision/cancel/confirm tests PASS; actual browser interaction not executed |
| BUG-E-001 | Address optional in schema/UI and nullable in DB | Address required in client workflow and server schema; whitespace-only rejected with Alamat showroom wajib diisi.; settings draft controlled so failures retain input; old nullable rows remain readable | Validation and authorized-action tests PASS; no schema constraint/migration; other contact fields remain optional |
| UX-E-002 | Result rendered below long form; empty field-errors could also accompany failures | One shared viewport notification per settings form group, explicit success/error/warning state, unique result identifier, accessible status/alert, keyboard-dismiss button. Bottom summaries removed to prevent duplicate notices; field errors retained | Component-wiring and semantic tests PASS; mobile/screen-reader runtime QA remains required |
| BUG-F-001 | Operator reports CMS 413 requests of 2,077,693 and 2,108,791 bytes at Nginx; shared validator/provider | CMS reuses decoder validation, keeps content namespaces and owner-row transactions, returns image-specific errors and safe storage diagnostics, preserves replacement/rollback cleanup and committed-state handling. Public CMS media bypasses optimizer consistently | Source PASS; the actual 413 transport blocker is NOT fixed by source code |

## 3. Upload policy and implementation details

| Area | Contract |
| --- | --- |
| File types | JPEG, PNG and WEBP; MIME, signature, decoder format and full pixel decode must agree |
| Size | Maximum 8,388,608 bytes inclusive; dealer logo maximum 4,194,304 bytes remains unchanged |
| Decoded resource bound | Maximum 25,000,000 pixels; multi-page/animated images rejected with a specific message; static files are the supported upload contract |
| Quality | Original validated bytes stored unchanged; no resizing or quality reduction |
| Decoder dependency | sharp 0.35.4 promoted to explicit runtime dependency, matching the version already required by Next in the lockfile; no additional decoder version or UI dependency introduced |
| Filenames | Server-generated unique suffix; repeated periods removed from normalized user basename; extension based on validated MIME at car/logo upload boundary; original user filename cannot choose an executable extension |
| Existing keys | No DB/key rewrite. Existing safe stored keys and CMS media namespaces remain compatible |
| Decoder errors | Safe Indonesian invalid/corrupt/dimension feedback; native error details not returned to clients |
| Operational errors | Controlled errno/Prisma-code allowlist only; no raw messages, file bytes, full paths, tokens, credentials or DB URL logged |
| Compensation | Vehicle/logo put now inside cleanup boundary; failed writes and transaction failures attempt removal of new key. Cleanup can still fail and requires operational inspection; no false guarantee of zero partial artifacts |
| Revalidation | Vehicle uploads/settings/logo operations distinguish committed save from revalidation failure and return warning instead of suggesting the committed data was lost |
| Media delivery | Keeps existing /uploads URL contract. Does not add routes, media aliases, storage roots, wildcard hosts or global images.unoptimized |
| Nginx | Existing Next action body limit stays 10mb; application file limit stays 8 MiB. Operator must separately configure the actual proxy/edge body limit with multipart overhead; neither source feedback nor optimizer bypass can repair a pre-action 413 |

## 4. Stage 4B.1 files changed

| Type | Files |
| --- | --- |
| Modified — image rendering | components/public/site-footer.tsx; components/public/site-header.tsx; features/car-detail/gallery.tsx; features/content/banner-carousel.tsx; features/content/public-sections.tsx; features/homepage/vehicle-card.tsx |
| Modified — forms | features/cars/car-form.tsx; features/cars/image-manager.tsx; features/master-data/master-data-forms.tsx; features/settings/dealer-settings-form.tsx |
| Modified — services/actions | server/cars/actions.ts; server/cars/service.ts; server/content/actions.ts; server/settings/actions.ts; server/settings/service.ts |
| Modified — validation/contracts | services/storage/key.ts; types/action-state.ts; validation/dealer-settings.ts; validation/upload.ts |
| Modified — dependencies | package.json; pnpm-lock.yaml |
| Modified — existing tests | tests/admin-service-auth.test.ts; tests/content-actions.test.ts; tests/settings-dashboard.test.ts; tests/theme-foundation.test.tsx; tests/upload-validation.test.ts |
| Added — source helpers | components/ui/action-notification.tsx; features/cars/form-draft.ts; features/forms/use-feedback-action.ts; features/master-data/rename-confirmation.ts; lib/image-delivery.ts; server/upload-feedback.ts |
| Added — tests/fixtures | tests/fixtures/images.ts; tests/stage4b1-actions.test.ts; tests/stage4b1-form-ui.test.tsx; tests/stage4b1-image-rendering.test.tsx; tests/stage4b1-next-image.test.tsx; tests/stage4b1-upload.test.ts |
| Added — report | docs/AUTOMOTIVE_STAGE4B1_REPORT.md |
| Stage-only total | 26 existing files modified, 13 new files, 0 deleted |
| Cumulative export total | 79 files relative to Git baseline: 41 modified, 38 added, 0 deleted |

The cumulative patch also includes all prior intended Stage 1–3C files and the Stage 4A audit report, including files still untracked in the original repository. Existing synthetic signature-only test fixtures were replaced with actual decodable 2x2 images; auth assertions were not weakened. Settings color/auth fixtures now contain an address because the settings write contract explicitly requires one.

## 5. Validation results

| Check | PASS | FAIL | BLOCKED / not executed | Evidence |
| --- | --- | --- | --- | --- |
| Unit/regression suite | 188 | 0 | 0 | 23 test files; no skipped tests; 143 previous cases plus 45 new cases |
| New source test files | 5 | 0 | 0 | Decoder/key, action/storage, form wiring, media component coverage and actual Next Image HTML |
| pnpm lint | 1 | 0 | 0 | ESLint exit 0 |
| pnpm exec next typegen | 1 | 0 | 0 | Route types generated |
| pnpm typecheck | 1 | 0 | 0 | TypeScript exit 0 |
| pnpm exec prisma validate | 1 | 0 | 0 | Schema valid; synthetic isolated staging URL only, no DB connection |
| pnpm build | 1 | 0 | 0 | Next 16.3.5 production build completed with synthetic staging environment |
| Git diff --check, tracked changes | 1 | 0 | 0 | No new tracked whitespace errors |
| PostgreSQL-backed E2E | 0 | 0 | 1 group | No database endpoint or credential used; no live writes/migrations |
| Real staging upload/HTTP/413 retest | 0 | 0 | 1 group | No infrastructure access or changes authorized |
| Browser/mobile/accessibility runtime QA | 0 | 0 | 1 group | Not executed; hook-harness/SSR tests are not browser certification |

Blocked entries above count verification groups, not fabricated individual test cases. Source command gates all pass. Production build does not prove staging DB, media delivery or proxy configuration.

| Regression area | Actual test evidence |
| --- | --- |
| Vehicle draft | Component hook harness edits every car field, returns price error, rerenders and verifies retained values/checkbox/model reset behavior |
| Address | Empty and whitespace rejected before DB write; valid multiline address accepted without requiring contacts; client required/custom validity and preserved draft tested |
| Rename | Old/proposed text, cancel/no dispatch, confirm/single dispatch, create/unchanged bypass tested |
| Notifications | One settings notification slot, explicit error/status roles, dismiss, fixed viewport positioning and distinct IDs for repeated results tested |
| Valid uploads | Real JPEG, PNG and WEBP decoded without changing the original File; 8 MiB inclusive boundary tested |
| Invalid uploads | Truncated signatures, damaged PNG data, MIME mismatch, unsupported types, empty/oversized files, oversized decoded dimensions tested |
| Storage safety | Unusual basenames/double dots/path separators/long names normalized; unsafe suffix/path traversal still rejected; MIME-derived keys and CMS namespace retained |
| Persistence | Vehicle first-cover write, DB failure cleanup, partial put cleanup, categorized permission error and safe logs; CMS corrupted-image rejection, permission failure and DB compensation tested with mocked services |
| Rendering | All public cards/gallery/CMS media/logo components tested for direct upload URLs. Actual Next Image output contains raw upload src, and static JPEG still contains optimizer URL |
| Authorization | Stage 3C page/service/action denial and authenticated mocks remain passing; no guard removed or bypass added |

## 6. Security and compatibility

| Control | Result |
| --- | --- |
| Authentication / authorization | Existing requireAdmin calls retained before sensitive page/query/mutation/upload work |
| CSRF/origin/session/cookies/limiter | No changes |
| Path and executable-file protection | Preserved and generated-key handling strengthened; no arbitrary filesystem path accepted |
| DB transactions | Existing vehicle and CMS transactions/owner-row lock retained |
| Public visibility | AVAILABLE-only logic unchanged; no tenant implementation introduced |
| Staging noindex/security headers | Unchanged |
| Public SEO/canonical/sitemap/robots | Existing cumulative behavior preserved |
| Database compatibility | Schema/migration files unchanged from pre-stage source; legacy null address still readable, but settings saves require a valid address |
| Native dependency deployment | Operator must install frozen lockfile with Sharp native packages for target platform before build; Next already depended on the same Sharp version |

## 7. Cumulative patch verification

| Item | Contract / result |
| --- | --- |
| Filename | dynicty-automotive-stage4b1-cumulative-fixes.patch |
| Intended base | Exact GitHub baseline 69325e6c9e7a19c8e477e5420bf22e6ae70a959a |
| Scope | Complete cumulative source including Stage 1–3C, Stage 4A audit and this stage; not an incremental patch for an already-patched VPS tree |
| Validation method | Independent temporary baseline trees; Git apply-check, actual apply, full file-content/mode comparison to intended current source; original index remains untouched |
| Executed validation result | PASS: git apply --check and actual application to an independent clean baseline tree both succeeded; all file contents and executable modes matched |
| Recreated source | PASS: 192 files including all required new files; no initial file removed; original source/index unchanged during export |
| Exclusions | Secrets, .env files, dependencies, build output, runtime uploads and unrelated export helpers outside the repository |
| Whitespace | Three known inherited Stage 2 whitespace findings remain in the old report/migration; no new Stage 4B.1 whitespace errors. Preserve exact old source rather than silently changing migration/report history |
| Artifact metadata | Final byte size, SHA256 and executed validation results are supplied alongside the downloadable patch to avoid self-referential report checksums |

Do not blindly apply this cumulative patch to staging that already contains Stage 1–3C. Validate the target source and apply-check in a separate release tree first; never reset or overwrite the existing dirty staging checkout to force application.

## 8. Remaining limitations and certification

| Item | Status / next evidence |
| --- | --- |
| Vehicle/CMS historical 413 | BLOCKED — source cannot change Nginx request-body limits; separate staging infrastructure task required |
| Existing corrupted stored objects | NOT REPAIRED — no live media/data access; re-upload valid files after infrastructure validation |
| Public image production verification | Required after authorized staging release; confirm raw uploads render without optimizer and all homepage/catalog/detail/CMS paths work |
| Full browser validation | Required at 390/768/1280px, including native confirmation, keyboard focus, notification visibility and failed-submit value retention |
| Real storage/DB QA | Required with isolated staging data; mocked transaction/cleanup tests do not prove runtime permissions or DB behavior |
| R2 | Existing adapter still deferred; no new R2 implementation |
| Final certification | PASS WITH LIMITATIONS — available source/regression/build gates pass; live upload/browser certification remains pending |

No commit, push, deployment, service restart, infrastructure modification or live database mutation was performed. Stop after report and cumulative patch delivery.
