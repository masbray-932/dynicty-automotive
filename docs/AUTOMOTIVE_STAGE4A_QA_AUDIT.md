# DYNICTY AUTOMOTIVE — Stage 4A Cumulative QA Bug Audit

Date: 25 October 2026 (UTC+07:00). Final status: **AUDIT WITH LIMITATIONS**.

This audit changes only this requested report. Application source, Git index, database, services, deployment and infrastructure were not changed. No patch was generated or applied. Staging observations below were supplied by the operator; they were not independently reproduced on the deployed host during this audit.

## A. Baseline assessment

| Check | Evidence / result |
| --- | --- |
| Repository | `masbray-932/dynicty-automotive`; origin URL matches the requested repository |
| Branch | `main` |
| HEAD / local origin/main | `69325e6c9e7a19c8e477e5420bf22e6ae70a959a` / same; no remote fetch performed |
| Actual application source | Git baseline plus uncommitted cumulative Stage 1–3B and Stage 3C; HEAD alone is not the application version |
| Initial working tree | 31 modified tracked files, 24 untracked files; no staged changes |
| Cumulative source completeness | All 178 existing source files match expected Git blob hashes from baseline and the two patch metadata sets. This comparison reads patch headers and computes file hashes; it does not apply a patch |
| Stage 1–3B artefact | 41 files; SHA256 `cd62b96ddf6c3d7126dd7ba4d92a907dfdf37d2a9ff637b106c163c6f56e5fd6` |
| Stage 3C artefact | 15 files; SHA256 `bf8190654a08161d5e9fae4a6f19a9525d4ad5d53dcbcf1aad43561d6d7f9103` |
| CMS migration | `prisma/migrations/20261008000000_stage_2_dealer_content/migration.sql` present; deployed migration status unknown |
| Theme foundation | `features/theme/domain.ts`, `theme-scope.tsx` and shared accessible controls present |
| Authentication | Seven protected pages call `requireAdmin`; layout, sensitive services and protected actions retain Stage 3C guards |
| Installed package contract | Next 16.3.5, React/React DOM 19.2.8, Prisma 6.19.0; PostgreSQL 17 is operator-supplied staging context, not locally verified |
| Current tests | `pnpm test`: PASS, 18 files / 143 tests; tests use pure logic or mocked services, not staging DB/storage/browser |
| Additional executed probes | Pure schema/key/signature calls: blank/whitespace addresses accepted as null; double-dot vehicle filename rejected by generated-key validation; truncated PNG header accepted |
| Probe tooling note | The tsx CLI IPC socket was unavailable; the same read-only probes succeeded using `node --import tsx`. No privileges were elevated |
| Infrastructure access | None used. No VPS, DB, Nginx, DNS, HTTP staging or filesystem inspections were performed remotely |
| Supplied staging contract | Ubuntu 24.04; preview service; app directory `/var/www/dynicty-automotive-preview`; uploads `/var/lib/dynicty/automotive-preview/uploads`; symlink `public/uploads`; loopback port 3101. These values are investigative context, not verified configuration |
| Missing evidence | Exact deployed cumulative source hashes, active proxy/storage configuration, failing request details, relevant file metadata, active migration state, and browser evidence |

## B. Seven-issue findings matrix

Status CONFIRMED means a source-level defect or requirement gap is established. PROBABLE means a supported mechanism exists but the cause of the reported staging occurrence is not established. Neither status implies deployed-host verification.

| Issue / priority | Observation | Relevant files / functions | Root cause and evidence | Confidence / status | Proposed fix | Regression risks / required tests |
| --- | --- | --- | --- | --- | --- | --- |
| BUG-C-001 / P2 | Vehicle input disappears after validation failure | `features/cars/car-form.tsx:33–67`; `server/cars/actions.ts:38–70`; `types/action-state.ts`; `validation/car.ts` | Most fields are uncontrolled `defaultValue` / `defaultChecked` controls. A normal validation failure resolves the React form action with only message/errors, not submitted values. Installed React DOM `startHostTransition` schedules form reset for action submission. Reset restores original defaults rather than the user's draft. Only brand has controlled client state; model selection can reset independently. No validation-failure redirect exists: the create redirect runs only after successful persistence | HIGH, CONFIRMED source mechanism; browser reproduction pending | Keep an explicit controlled draft covering all vehicle fields, including model/status/featured. Clear model only when brand actually changes. Preserve raw strings on server validation and persistence failure; reset only on intended success. Retain server-side Zod validation and field ARIA wiring | Test create/edit failures, invalid price/year/mileage/description, brand-model mismatch, checkbox/select persistence, double submission and successful create redirect; real React/browser test required |
| BUG-C-002 / P1 | Some car uploads fail with little explanation | `server/cars/actions.ts:83–99`; `server/cars/service.ts:70–95`; `validation/upload.ts`; `services/storage/{key,local,r2}.ts`; `next.config.ts`; preview Nginx example | Confirmed diagnostic gap: provider/DB failures collapse to `car.image_upload_failed` plus carId, and a generic UI message; stage/error code is discarded. Confirmed filename edge case: `createCarImageKey` retains `..` in `IMG..jpg`, then `assertSafeStorageKey` rejects it. The actual QA failure may instead be transport limit, permission, R2 selection, invalid MIME, missing car/DB issue or filesystem failure; no failing filename/request/log exists | HIGH for diagnostic gap and reproducible filename edge; LOW–MEDIUM for staging cause, PROBABLE overall | First classify request failure versus returned action failure. Record safe operation/provider/error-code context internally; expose concise actionable messages without paths/secrets. Generate canonical server filenames/extensions from validated MIME and UUID rather than original basename. Fix only the demonstrated transport/permission/provider issue | Valid JPEG/PNG/WEBP; 8 MiB boundary; unusual names; forbidden MIME/signature; no session/expired session; filesystem/DB errors; compensation; request below/above actual proxy limit |
| BUG-C-003 / P1 | Upload succeeds, row is Cover, preview is broken | `server/cars/service.ts:70–95`; edit page `:22–23`; `services/storage/local.ts:8–21`; `features/cars/image-manager.tsx:29–32`; installed Next `server/lib/router-utils/filesystem.js`; Nginx example | Successful `put` and image transaction do not verify that an HTTP GET serves a decodable image. Cover is a DB flag. Local URL is `/uploads/<key>`. Installed Next production code enumerates public files during startup and resolves against that set, so new runtime uploads cannot be assumed discoverable through Next. Repository Nginx proxies all paths and has no dedicated media location. This is a concrete source/topology incompatibility if the deployed config is equivalent, but active Nginx may already differ. Additional confirmed acceptance gap: an 8-byte PNG signature alone passes validation even though it is not a decodable PNG | HIGH for delivery design gap, MEDIUM for reported occurrence, PROBABLE overall | Verify the exact file and GET path first. Prefer a narrowly scoped static media location for the isolated persistent root, or a safe explicit media-serving route, rather than relying on Next public-directory refresh. Preserve URL/key mapping, traversal defense and noindex. Verify decoding/structure where appropriate with bounded resources. Do not restart on every upload | Upload after process startup, immediate GET, valid content type/body, persisted media, symlink/permission failures, corrupted files, raw and optimized paths, missing-file behavior, proxy traversal and admin-HTML denial tests |
| BUG-D-001 / P3 | Rename commits without old/new confirmation | `features/master-data/master-data-forms.tsx:9–22`; `server/master-data/actions.ts:15–39`; `features/cars/delete-car-button.tsx` | Brand form submits directly to authenticated action; no confirmation handler/dialog exists. Native `window.confirm` already exists for deletion, but no reusable custom dialog component is present. Rename updates brand name/slug while retaining brand ID; model and vehicle foreign-key references remain linked | HIGH, CONFIRMED UX gap | Add confirmation to existing-brand renames only: trimmed old/new names, cancel prevents submission and preserves draft, confirm uses existing action. Follow native-confirm precedent for smallest change; no prompt for create/unchanged name. Keep duplicate validation and authorization server-side | Cancel causes zero mutation; confirm exactly once; unchanged/new name flows; duplicate-name failure; pending state; keyboard/mobile; labels/filter URLs after brand slug changes; do not regenerate all vehicle slugs |
| BUG-E-001 / P2 | Empty showroom address saves | `validation/dealer-settings.ts:6,18`; settings form `:23`; `server/settings/actions.ts:18–23`; settings service `:21–23`; `prisma/schema.prisma:117` | Address is explicitly optional throughout: textarea lacks required; `optionalText(500)` trims empty/whitespace to null; action accepts schema and upserts; DB field is nullable `String?`. Pure probes confirmed both empty and whitespace values accepted as null. This is a requirement mismatch, not an auth bypass | HIGH, CONFIRMED | Require trimmed nonempty address in server schema and client field, display field error and preserve all draft values. Keep legacy nullable DB data readable; require completion on subsequent settings save. A DB NOT NULL migration is unnecessary for the minimum fix and would need a separate data policy | Empty/whitespace/missing address rejected without write; valid multiline address/max length; old null rows render safely; other inputs survive validation failure; authorization retained |
| UX-E-002 / P3 | Save result appears below long settings form | `features/settings/dealer-settings-form.tsx:13–26`; `types/action-state.ts`; shared UI inventory | Message is in normal document flow after Save, not viewport positioned. It has `aria-live="polite"` but no visual outcome type. No toast/Toaster/notification dependency or shared component exists. `errors: {}` is also used for operational failures, so empty field-errors cannot identify success | HIGH, CONFIRMED UX gap | Add a small reusable viewport notification using existing UI tokens and explicit success/error/warning outcome. Polite status for success; accessible alert for failure; dismiss control, safe top offset, mobile wrapping; preserve nearby field errors and draft. Reuse the new primitive across related forms only where needed, without a new UI framework | Offscreen submission, 390/768/1280px, keyboard/screen reader, reduced motion, repeated same result, error versus success, dismiss/timeout, no control obstruction |
| BUG-F-001 / P1 | CMS media fails; car uploads also fail | `features/content/content-editor.tsx:13–55`; `server/content/actions.ts:23–35,43–98`; `services/storage`; `validation/dealer-content.ts` | CMS uses the same validator/provider/root as car uploads, so body limits, permissions, wrong provider and public delivery may be shared. Actual failure is unproven. CMS also has independent failure points: content migration/tables, profile validation, image alt requirement, active-main maximum, owner-row lock and item cap. Unlike cars, CMS generates MIME-derived extensions; vehicle double-dot filenames therefore do not explain CMS failures. Validation/storage errors often do not populate `errors.image` | HIGH for shared architecture; LOW–MEDIUM for occurrence, PROBABLE | Diagnose common transport/storage boundary first, then CMS transaction/validation separately. Reuse safe categorized upload handling and durable public serving where common. Preserve row-lock limits, cleanup compensation, media namespaces, and existing auth checks | Main/promo/showroom/partner uploads, replacement cleanup, sixth active banner, migration present, alt requirement, DB failure after upload, revalidation after commit, field feedback and selected-file re-selection behavior |

## C. Upload architecture analysis

| Layer | Vehicle path | CMS path | Implication |
| --- | --- | --- | --- |
| Client form | ImageManager action with one `image` File, no multiple attribute | ProfileEditor / ItemEditor action with one `image` File | Browser accept is UX only. Current UI does not implement a batch upload; whole multipart body includes form fields |
| Authentication | Guard in uploadImageAction and uploadCarImage | Guard before CMS parsing/upload; admin content read guarded | Stage 3C must remain intact. Framework auth redirects should not be swallowed by upload error classification |
| Validation | `validateImageUpload`: nonempty, maximum 8,388,608 bytes, exact JPEG/PNG/WEBP MIME, short magic signature | Same validator; logo separately caps at 4,194,304 bytes | HEIC/HEIF/SVG/GIF are unsupported by contract; do not silently permit them. Signature check is not proof of full decoding |
| Transport | Next Server Actions total-body limit `10mb` | Same total-body limit | Repository Nginx does not declare client_max_body_size. Active inherited Nginx/edge limits are unknown; do not assume the UI's 8 MiB limit is reachable |
| Key generation | `cars/<carId>/<uuid>-<sanitized-original-name>` | `dealers/default/content/<namespace>/<uuid>.<MIME extension>` | Vehicle path validation can reject retained double dots. CMS and vehicle naming are not identical |
| Provider selection | Shared getStorageProvider / server env | Same | R2 put/delete remain deliberate throwing stubs; if selected, writes fail for both. Selected staging provider has not been inspected |
| Physical local destination | `process.cwd()/public/uploads/<key>` | Same root, separate content subdirectories | Provided symlink should resolve this to `/var/lib/dynicty/automotive-preview/uploads/<key>`. Actual cwd, symlink target and effective permissions are unknown |
| Storage write metadata | Local provider writes bytes and returns relative URL; supplied contentType is not stored separately | Same | Extension influences static MIME delivery; write success does not establish decode/HTTP success |
| DB persistence | Write file, then transaction checks car, sort order and first-image primary flag; delete new file on DB failure | Write file, then owner-locked transaction; replacement/delete cleanup and committed-state handling | A committed DB row proves reference storage, not browser visibility. DB schema/record errors can be feature-specific |
| Partial-write behavior | put occurs before compensation try; cleanup failures after DB rejection are suppressed | Failed put attempts cleanup; cleanup warning logged | Proposed shared code must preserve compensation and avoid promising that no partial artifact exists when cleanup itself failed |
| Public URL | `/uploads/<storageKey>` for local | Same | No application media Route Handler exists; symlink alone does not establish HTTP routing |
| Admin image render | Next Image `unoptimized`, original relative URL | Local blob preview bypasses server; saved relative banner uses Next optimizer, showroom/partners also render images | Car preview cannot be blamed on remotePatterns: it bypasses optimizer. CMS blob preview can work while saved URL is broken; optimizer can add another failure layer |
| Next production serving | Public filenames enumerated at startup; cached lookups use that set | Same | New file visibility requires a real media-serving strategy. This is distinct from file write failure |
| Success semantics | Action returns success after put+DB; no GET/decode check | Similar, with explicit committed/revalidation distinction | Cover/success badges do not prove successful public retrieval. Do not infer BUG-C-002 and BUG-C-003 are the same incident |
| Failure feedback | Signature validation gives field errors; provider/DB failures generic | ContentError may display useful text, other failures generic, usually no image field error | Add safe error categories/operation context without logging original file bytes, full paths, credentials, token or raw Prisma messages |

### Shared cause versus separate cause

| Candidate | Could explain upload rejection C-002/F-001? | Could explain broken preview after success C-003? | Current evidence |
| --- | --- | --- | --- |
| Request/body limit before action | Yes, especially larger files | Not the already-successful request alone | Active proxy limit and HTTP 413 needed |
| Unwritable directory / wrong symlink/cwd | Yes; potentially different permissions in each namespace | Yes if serving and writing map to different roots; pure write denial should not produce genuine success | Effective service-user permissions and exact path needed |
| Next startup public-file inventory / absent media alias | Does not itself prevent put or DB commit | Strong candidate for new-file 404 | Framework implementation and repo proxy confirmed; active config unverified |
| R2 selected while adapter stubbed | Yes for both | Does not explain a genuine successful put from this adapter | Provider selection needed |
| Vehicle original filename retaining `..` | Yes for affected vehicle filenames | Rejected write should not create a successful new image row | Pure key probe confirmed; CMS key generation avoids this case |
| Corrupt/truncated image accepted by signature check | Usually put/DB succeed | Yes, if browser cannot decode even a 200 response | Eight-byte PNG acceptance confirmed; QA file unknown |
| CMS-specific migration/validation/transaction | CMS only | May cause stale/replaced media issues; not a general vehicle cause | Need existing logs and migration status |

## D. Cross-cutting findings and remediation sequence

| Order | Proposed implementation scope | Acceptance gate / regression control |
| --- | --- | --- |
| 1 | Capture one failed car upload, one failed CMS upload, and one successful-but-broken image as separate timestamped incidents | Capture filename class, MIME, size, HTTP/action result, safe log event and exact image GET. Do not group causes prematurely |
| 2 | Establish effective provider, write root, service-user permissions and read mapping; fix only demonstrated environment mismatch in a separately authorized staging task | Read-only path/config evidence first; no chmod 777, broad alias, public raw app port, or production path reuse |
| 3 | Implement durable isolated media delivery for runtime files if existing routing is insufficient; align whole-request size limits with 8 MiB file policy plus bounded overhead | Upload after startup must be immediately readable and decodable through actual staging URL. Serving path must not expose app source, .env, admin data or executable content |
| 4 | Normalize server-generated MIME-based keys and categorize upload failures consistently; preserve type/signature/size/auth/path restrictions and compensation | Test car/CMS/logo separately; do not complete R2 or add heavy processing merely to bypass an unrelated local issue |
| 5 | Preserve vehicle/settings/CMS form drafts across expected failures; add required address validation | Controlled client draft with server authority; file inputs cannot be programmatically repopulated, so explain re-selection and keep text fields; do not serialize File objects into action result |
| 6 | Brand rename confirmation and explicit result state + shared notification primitive | Native confirmation is already an established minimal option. Reuse FormField/Button/theme focus styles. Do not infer success from absence of field errors |
| 7 | Execute regression, staging integration and browser matrix before certification | Stage 3C anonymous HTML/RSC/prefetch protections must still hold; real authenticated E2E required |

| Cross-cutting topic | Audit conclusion / risk |
| --- | --- |
| Required settings | Dealer name is the only currently required textual identity field: server min 2 / max 100 and client required. Address is newly required by this QA request. Phone, WhatsApp, email, maps, socials, colors and logo remain optional; no evidence authorizes making them mandatory |
| Existing data | Nullable/blank addresses and fallback settings must remain readable; enforce new rule on saves without inventing an address or silently overwriting legacy data |
| Error state | `ActionState` contains only message/errors. Operational failures with `{}` field-errors can be styled as success in CarForm. Introduce explicit outcome semantics before shared toast styling |
| Other forms | Settings/CMS/master data also rely on uncontrolled fields and normal action returns; audit preservation there while fixing vehicle draft loss. CMS editors remount on updatedAt changes, which can intentionally clear local state after successful save |
| Brand/model linkage | Rename preserves IDs and does not move models to another brand. Brand slug changes can affect filters/navigation; existing vehicle slugs need not be rewritten. Test public label/query refresh rather than adding broad slug migration |
| Dealer isolation | Current system is single dealer (`default`) and shared global inventory; authentication authorizes this dealer's admin. No tenant resolver/tenant IDs exist. Do not claim or implement tenant isolation in this audit |
| Media exposure policy | Selected image objects are public-media resources; authenticated mutation does not make their GETs private. Any static alias must be confined to approved media, not used to serve admin page data or a general filesystem tree. Decide separately if DRAFT media itself needs private delivery |
| Sensitive logs | Preserve safe public messages. Add controlled provider/operation/error-code/request correlation internally; never log cookies, session tokens, passwords, env dumps, database URL or raw image/form content |

## E. Regression test plan

| Level | Required scenarios | Required evidence |
| --- | --- | --- |
| Existing suite | Run all current tests; maintain Stage 2 CMS/theme and Stage 3C auth coverage | Current audit: 143/143 PASS; mocked tests alone do not prove storage or deployment behavior |
| Unit — validation | Address empty/whitespace/missing/max length/multiline; preserve dealerName rule and optional contact fields; key generation for spaces/unicode/double dots/odd extensions; supported and forbidden MIME/signatures; truncated image policy | Deterministic parse/key results; authoritative invalid-update rejection |
| Component/browser — drafts | Fill every car field, induce server-only validation error, verify each value; edit defaults versus new drafts; model remains valid with brand; checkbox; settings/CMS failures; retry | Real DOM values and visible errors, not only static HTML output |
| Unit — actions/services | Auth before validation/storage/queries; safe categories for storage/DB failure; success/error distinction; no accidental DB success on write failure; replacement compensation and cleanup failure reporting | Mocked call order plus response state; never weaken Stage 3C |
| Isolated DB integration | Real PostgreSQL transaction/constraint behavior, image row/key/cover, required address no-write rejection, CMS owner lock/active count and migration presence | Dedicated staging/test DB; any test writes require separate implementation/QA authorization and disposable fixtures |
| Real storage/HTTP integration | Valid JPEG/PNG/WEBP after process startup; small/near-8-MiB/over-limit; immediate raw URL GET; optimized CMS URL; bytes/content type/decode; read after existing restart evidence or separately approved restart test; cleanup | HTTP bodies plus actual filesystem/key mapping, not status/badge only |
| Negative upload | HEIC/SVG/GIF/executable rejected; MIME mismatch; oversized multipart; truncated file; missing file; unusual basename; permission/disk/provider error; DB error after put | Useful safe feedback; consistent limits; no unauthorized writes or orphan reference |
| Brand UX | Cancel unchanged database; confirm exact old/new names; no prompt for creation/unchanged; duplicate failure retains input; one mutation while pending | Browser and isolated DB assertions |
| Notifications | Top-visible success/error/warning on long form; repeated result; close; screen-reader announcement; field errors retained; no control obstruction | Desktop and mobile browser checks |
| Authorization | No cookie, invalid/expired session, authenticated session; direct action/upload access; every protected route HTML/RSC/prefetch contains no private data when denied | Retain current tests and use `scripts/verify-admin-auth.mjs` on authorized isolated staging, plus real POST/upload E2E |
| Responsive | 390px, 768px, 1280px+: form, feedback, confirmation and media previews | Browser screenshots/inspection; not claimed from source |
| Build gates after fixes | pnpm lint; pnpm exec next typegen; pnpm typecheck; pnpm test; pnpm exec prisma validate; pnpm build | Required in implementation stage. Lint/typegen/typecheck/Prisma/build were not rerun during this read-only audit |

## F. Unresolved questions and targeted staging evidence

| Question | Minimum evidence needed |
| --- | --- |
| Is deployed source equivalent to this audit? | HEAD plus SHA256 of car form/actions/service, local provider, CMS actions, settings schema, Next config and active Nginx excerpt; HEAD alone is insufficient |
| Where does the upload fail? | Timestamp, feature, byte size, browser-reported MIME, HTTP status, sanitized action message and existing server event. Distinguish HTTP 413/403/5xx/redirect from a 200 action payload reporting failure |
| Which provider is selected? | Operator reports STORAGE_PROVIDER and staging-local opt-in as names/booleans only, not an environment-file dump |
| Where does the service write? | Actual configured User/Group/WorkingDirectory and resolved public/uploads target; directory/file traverse/read/write permissions for that user |
| Does a broken image physically exist? | One existing staging CarImage key, exact browser URL, file size/type/mtime and permission metadata; do not share the actual private image or credentials |
| Is the response 404 or a decode error? | Compare exact public GET and localhost GET: status, content type, byte count. If 200, verify it is image bytes rather than HTML and can decode |
| Does Nginx serve uploads directly? | Preview server block and relevant inherited upload body limit/static mapping, with secrets and unrelated application details removed |
| Are CMS migrations present? | Existing Prisma migration status/read-only table existence from isolated staging; no deploy/reset/db push |
| What is mandatory? | Address is required by this task; only dealerName is otherwise established. Confirm any future required contact rule explicitly before implementation |

The following are **operator-run read-only diagnostics**, not commands executed by this audit. Use only the preview server and confirmed isolated staging DB. Do not paste credentials, whole environment files, raw request bodies, unfiltered logs or full Nginx configuration.

```bash
# Service identity and path; intentionally excludes Environment and command arguments.
systemctl show dynicty-automotive-preview.service \
  -p User -p Group -p WorkingDirectory -p MainPID -p ActiveEnterTimestamp

readlink -f /var/www/dynicty-automotive-preview/public/uploads
namei -l /var/www/dynicty-automotive-preview/public/uploads
stat -c '%U:%G %a %n' /var/lib/dynicty/automotive-preview/uploads

# Only after verifying the configured service user is dynicty; creates no file.
sudo -u dynicty test -w /var/lib/dynicty/automotive-preview/uploads
sudo -u dynicty test -x /var/lib/dynicty/automotive-preview/uploads

# Replace with ONE actual existing staging key copied from the broken image URL.
# Inspect that file's permissions and mtime; do not use a production key.
namei -l /var/lib/dynicty/automotive-preview/uploads/REPLACE_WITH_EXISTING_KEY
stat -c '%s bytes | %U:%G | %a | %y' /var/lib/dynicty/automotive-preview/uploads/REPLACE_WITH_EXISTING_KEY
file --mime-type /var/lib/dynicty/automotive-preview/uploads/REPLACE_WITH_EXISTING_KEY

curl --max-time 15 -sS -o /dev/null \
  -w 'public status=%{http_code} type=%{content_type} bytes=%{size_download}\n' \
  'https://automotive-preview.dynicty.com/uploads/REPLACE_WITH_EXISTING_KEY'
curl --max-time 15 -sS -o /dev/null \
  -H 'Host: automotive-preview.dynicty.com' \
  -w 'local status=%{http_code} type=%{content_type} bytes=%{size_download}\n' \
  'http://127.0.0.1:3101/uploads/REPLACE_WITH_EXISTING_KEY'

# Existing safe application event names only; narrow the interval to the incident.
journalctl -u dynicty-automotive-preview.service --since '15 minutes ago' -o cat \
  | rg 'car\.image_(rejected|upload_failed)|content\.(upload_rejected|mutation_failed|media_cleanup_failed|revalidation_failed)'
```

These checks cannot establish write success without a separately authorized upload. A writable root alone does not prove writable preexisting car/content subdirectories; inspect the exact parent chain. A file newer than process startup supports the Next runtime-file hypothesis but is not sufficient by itself. Do not restart services just to test that hypothesis during this audit.

## Final assessment

| Category | Result |
| --- | --- |
| Audit status | AUDIT WITH LIMITATIONS |
| Confirmed causes/gaps | React action reset plus uncontrolled draft; optional address schema/UI/DB contract; missing rename confirmation; bottom-only notification and missing explicit outcome; opaque upload diagnostics; double-dot vehicle-key rejection; signature-only validation accepts incomplete files |
| Strongest unverified preview hypothesis | Newly written files are not directly served by an active media location and are missing from Next production public-file inventory |
| Other unverified causes | Active proxy body limits, symlink/cwd mismatch, service-user permissions, selected R2 stub, CMS schema/transaction issues, actual file corruption |
| Build/browser/staging certification | Not claimed; current mocked regression suite passes, but real staging incidents require the evidence above |
| Source changes | None; only this requested audit report created |
| Index / DB / deployment / infrastructure | Unchanged; no commits, pushes, patch operations, migrations, uploads, restarts or remote access performed |

Stop here. Fix implementation and staging write tests require the next explicitly authorized task.
