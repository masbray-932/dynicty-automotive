# Dynicty Automotive — Standalone S5.1 implementation report

Tanggal: 9 November 2026 (WIB). Seluruh runtime/data pada laporan ini disposable; tidak ada instalasi pelanggan yang disertifikasi.

## 1. Baseline dan lingkungan

| Item | Evidence |
|---|---|
| Repository | `masbray-932/dynicty-automotive`; remote GitHub sesuai |
| Verified main baseline | `740b36ce562009949572b10dc52a19b84c232e81`; local HEAD dan `git ls-remote origin refs/heads/main` cocok sebelum implementasi; diverifikasi lagi sebelum publication |
| Branch | `feat/automotive-standalone-s5-1-release-remediation`; feature worktree, main tidak diedit |
| Kondisi awal | Clean, cumulative S2–S5 source dan reports tersedia; tidak merekonstruksi stage lama |
| Dokumen/source | S2/S3/S4 implementation reports, installation contract, S4 checklist/runbooks/templates, S5 QA matrix/report/blockers; Prisma dan enam migration; auth/session, ownership, storefront, CMS/settings/media dan tests |
| Build tools | Node 24.22.1, pnpm 11.25.0, Next 16.3.5, React 19.2.8, Prisma 6.19.0, TypeScript 5.9.3, Vitest 5.0.0 |
| Database | PostgreSQL 17.11 (Debian 17.11-0+deb13u1), fresh disposable clusters; TCP only, enam migration lengkap; staging seed sintetis ditambah owned/mixed fixtures pada DB uji terpisah |
| Browser | Chromium Headless Shell 156.0.8078.47, Playwright 1.62.1; 390×844, 768×1024, 1280×900 |
| Ingress | Nginx 1.26.3 / OpenSSL 3.5.7; loopback HTTPS 8443 ke Next 3123, sertifikat self-signed khusus QA; browser mengabaikan trust certificate hanya pada test |
| Sandbox | Unix sockets dilarang. `node --import tsx` dipakai untuk seed; networkInterfaces shim di luar Git hanya memasok loopback, tidak mengubah auth/origin/ownership. Host-resolver browser `.test` gagal di sandbox; browser memakai HTTPS IP loopback. Named-host isolation diuji terpisah melalui Nginx |
| Live infrastructure | Tidak diakses; tidak ada DNS, public certificate, VPS, staging/production database atau customer media yang diubah |

## 2. HTTP 404: root cause, implementasi, dan evidence

| Area | Sebelum | Koreksi dan evidence |
|---|---|---|
| Streamed not-found | Public layout memulai streaming sebelum page-level notFound; detail excluded mengembalikan 200/noindex | Server-only publication gate pada Proxy matcher `/cars/:slug`, sebelum App Router render; memakai legacy AVAILABLE ownership predicate yang sama |
| Metadata-only approach | notFound di generateMetadata dan blocking metadata saja masih 200 pada eksperimen produksi | Tidak mengandalkan pendekatan tersebut untuk status. Metadata tetap menolak missing scope; DB error mendapat judul generik/noindex |
| Negative caching | Eksperimen rewrite ke static `_not-found` menghasilkan `s-maxage=31536000`; header proxy saja ditimpa Next | Root 404 memakai connection() sehingga request-time; final transport tests mensyaratkan no-store dan noindex pada semua excluded response |
| RSC | Next 16 menormalkan request dan menghapus Flight headers sebelum Proxy; dynamic rewrite dapat berakhir 200 untuk RSC | `skipProxyUrlNormalize: true` memakai kontrak Next terpasang; negative RSC/HEAD response dikembalikan langsung. Tidak membuat private Flight payload atau melakukan body rewriting di Nginx |
| Query/performance | Existing request-local React cache menyatukan detail metadata/page | Gate menambah satu indexed ID-only query per detail GET/HEAD, tanpa relations/related/settings; query detail tetap authoritative dan request-memoized. Tidak ada persistent availability cache atau header client yang dijadikan scope |
| Error | DB unavailable bukan berarti record tidak ada | Gate error meneruskan ke error handling halaman. Actual DB shutdown menghasilkan generic noindex state HTTP 200; tidak mengungkap Prisma/connection URL dan tidak salah disebut 404 |
| Race | Gate dan page read bukan satu snapshot transaction | Page tetap mengecek ownership/AVAILABLE lagi. Perubahan tepat di antara dua read bisa tetap memakai streamed fallback, tetapi tidak boleh membocorkan record excluded. Tidak mengklaim atomic status guarantee saat concurrent mutation |

| Fixture | Baseline HTML | S5.1 HTML | S5.1 RSC | S5.1 HEAD | Hasil |
|---|---|---|---|---|---|
| AVAILABLE legacy — `toyota-avanza-preview-1` | 200 | 200 | 200 | 200 | PASS |
| Unknown — `unknown-vehicle` | 200 | 404 | 404 | 404 | PASS |
| DRAFT — `honda-brio-preview-14` | 200 | 404 | 404 | 404 | PASS |
| SOLD — `suzuki-xl7-preview-15` | 200 | 404 | 404 | 404 | PASS |
| Registered — `registered-qa-car` | 200 | 404 | 404 | 404 | PASS |
| Mixed owner — `mixed-ownership-qa-car` | 200 | 404 | 404 | 404 | PASS |

| Pemeriksaan tambahan | Evidence | Status |
|---|---|---|
| Enam fixture × tiga transport | `node scripts/verify-vehicle-http-status.mjs` — 18/18; stream penuh dibaca; excluded HTML noindex, semua excluded no-store/X-Robots; tidak ada Vehicle JSON-LD/private marker | PASS |
| Fresh availability | Actual SQL pada fixture disposable: AVAILABLE → SOLD → AVAILABLE menghasilkan HTTP 200 → 404 → 200 tanpa restart | PASS |
| Client navigation setelah revoke | Halaman catalog dibuka, fixture diubah SOLD, link Next diklik: request RSC 404 dan navigasi HTML 404; branded not-found tampil; 0 uncaught page error. Prefetch shell 200 sebelumnya bukan detail record | PASS |
| Canonical spoof | Host dan X-Forwarded-Host attacker tidak mengubah canonical `https://127.0.0.1:8443/cars/...` | PASS |
| DB error | Actual PostgreSQL shutdown; generic noindex UI, tanpa DB URL/Prisma error di response | PASS WITH LIMITATION — generic error state masih HTTP 200 |

## 3. Browser QA — executed combinations only

| ID | Viewport | Skenario dieksekusi | Evidence | Status |
|---|---|---|---|---|
| S51-B01 | 390x844 | mobile login and admin navigation | Authenticated navigation works and dashboard has no horizontal overflow. | PASS |
| S51-B02 | 390x844 | mobile vehicle validation recovery and creation | Server validation preserves draft; valid retry creates the vehicle. | PASS |
| S51-B03 | 390x844 | mobile image size rejection, upload, cover, reorder and delete | 9 MiB file rejected; two images uploaded; cover/reorder/delete completed. | PASS |
| S51-B04 | 390x844 | mobile critical vehicle edit confirmation | Cancel preserves data/focus; confirmation publishes the vehicle. | PASS |
| S51-B05 | 768x1024 | tablet brand and model operations | Create model/brand and confirmed rename work at tablet width. | PASS |
| S51-B06 | 768x1024 | tablet profile, branding and logo replacement | Logo upload/replacement, theme, dialog keyboard behavior and operational profile persisted. | PASS |
| S51-B07 | 768x1024 | tablet CMS profile and all requested modules | Welcome/about/showroom/hours, main banner, promo, FAQ and leasing partner saved. | PASS |
| S51-B08 | 1280x900 | desktop public propagation and responsive layout | CMS/profile/theme and published vehicle are visible on public pages without overflow. | PASS |
| S51-B09 | 1280x900 | desktop media bytes through HTTPS ingress | Vehicle PNG 1677 bytes; logo WebP 224 bytes; banner PNG 10739 bytes; SHA-256 dicatat di tabel media. | PASS |
| S51-B10 | 1280x900 | desktop logo and CMS deletion confirmations | Logo bytes are removed and FAQ deletion requires explicit confirmation. | PASS |
| S51-B11 | 1280x900 | desktop logout and protected-route denial | Logout has no confirmation and protected navigation redirects to login. | PASS |
| S51-B12 | 1280x900 | browser console | No unexpected page/console errors; deliberate deleted-logo 404 is recorded separately. | PASS |


| Coverage boundary | Status |
|---|---|
| Seluruh cross-product fitur × 390/768/1280 | NOT TESTED; tabel hanya mencantumkan kombinasi yang benar-benar dijalankan |
| Cross-browser, full WCAG, customer operator acceptance | NOT TESTED |
| Named customer hostname/public TLS | BLOCKED; browser memakai IP loopback HTTPS/self-signed |
| Console | 0 unexpected console errors, 0 uncaught page errors. Satu 404 console message sengaja ditimbulkan oleh fetch logo setelah deletion, dan dicatat sebagai expected negative test |
| CMS save feedback | Persistence dan publikasi dibuktikan dengan reload/public UI; CMS key remount dapat menghapus pesan sukses. Tidak mengklaim status-text assertion sebagai bukti persistence |

## 4. Media ingress — actual bytes dan persistence

| ID | Pemeriksaan | Evidence | Status |
|---|---|---|---|
| S51-M01 | vehicle-bytes | `{"status":200,"mime":"image/png","bytes":1677,"sha256":"a81890ba35a2732ecc54c4354a786183d2100f610c17828fed9aed5aa2ae768c"}` | PASS |
| S51-M02 | banner-bytes | `{"status":200,"mime":"image/png","bytes":10739,"sha256":"ec6194bd71391f84725bb5b302072c42d5eed56a29ef26dd1df3e27770c5d10d"}` | PASS |
| S51-M03 | replacedLogo | `{"status":404}` | PASS |
| S51-M04 | deletedLogo | `{"status":404}` | PASS |
| S51-M05 | cross-customer-media | `{"a":"09fd3839cd8193927135db7ab7be6066eed42ec1647c3c9f52e7fc07d4201ad6","b":"5c47eb408cc7ebde01d8459f14c24ea95c1efbe493c7a3e868e9f9189bed093a","foreignStatus":404}` | PASS |
| S51-M06 | unknown-host | `{"status":421}` | PASS |
| S51-M07 | traversal:/uploads/%2e%2e/%2e%2e/etc/passwd | `{"status":400}` | PASS |
| S51-M08 | traversal:/uploads/cars/%2e%2e/%2e%2e/etc/passwd | `{"status":404}` | PASS |
| S51-M09 | traversal:/uploads/isolation/shared.png%00.html | `{"status":400}` | PASS |
| S51-M10 | nginx-size-limit | `{"status":413,"bytes":13631488}` | PASS |


| Pemeriksaan lanjutan | Evidence | Status |
|---|---|---|
| Upload through app | Browser mengirim PNG melalui HTTPS → Nginx → authenticated Server Action; vehicle/banner/profile/logo workflow selesai | PASS |
| Logo normalisasi | PNG diolah existing workflow menjadi WebP, 224 bytes, SHA-256 `7de1d37dd8d2e222684310ab173332effdf9e25a79aff0492ecf03f19b26eb66`; MIME `image/webp` | PASS |
| App limit | Browser mengirim file 9 MiB di bawah Nginx 12 MiB cap; aplikasi menolak dengan “Gambar ditolak”; 8 MiB application limit tidak dilemahkan | PASS |
| Restart persistence | Next dihentikan lalu dimulai lagi; /healthz 200; seluruh 10 media checks diulang dan digest cocok | PASS |
| Storage isolation boundary | Dua physical media roots dipilih vhost; same key berbeda bytes; B-only object 404 melalui A | PASS untuk HTTP namespace; tidak membuktikan UID/GID/OS ACL terpisah |
| Customer filesystem/service identity | Tidak ada host pelanggan atau systemd runtime | BLOCKED |
| Public TLS/SNI certification | Self-signed QA dan vhost test bukan certificate-chain/hostname/SNI certification pelanggan | BLOCKED |

## 5. Security dan compatibility

| Boundary | Actual evidence | Status |
|---|---|---|
| Unauthorized Admin | `scripts/verify-admin-auth.mjs`: 7 routes × HTML/RSC/prefetch = 21/21; seluruh response body dibaca; tidak ada inventory/CMS/private marker. Authenticated variant script tidak dijalankan; authenticated browser terpisah lulus | PASS untuk anonymous matrix |
| Cookie | Browser: dynicty_admin_session HttpOnly/Secure/SameSite=Lax, host-only 127.0.0.1, path `/`; cookie/token value tidak dicatat | PASS lokal |
| Origin | Captured authorized action diulang dengan attacker Origin: HTTP 500 rejection; runtime log “Invalid Server Actions request”; existing origin guard tetap aktif | PASS lokal |
| Ownership | NULL-owner + nested brand/model NULL + AVAILABLE tetap predicate wajib; registered/mixed fixture tidak tampil; tidak ada scope dari raw Host/body/query | PASS |
| Upload/media | Existing validator/namespace/path guards tidak diubah; malformed/size/key regression suite lulus; real PNG upload/size rejection + Nginx tests di atas | PASS |
| Canonical/cache | Origin tetap deployment env; no-store negative gate; tidak ada dealer activation atau cache tenant baru | PASS |
| Database | Tidak ada schema/migration/seed source change, backfill atau live mutation | PRESERVED |
| Admin/CMS/branding | Tidak diubah; confirmation dan authorized save/upload paths tetap dipakai browser | PRESERVED |

## 6. Changed files

| File | Perubahan |
|---|---|
| `app/(public)/cars/[slug]/page.tsx` | Metadata not-found terpisah dari DB error; canonical sukses tetap sama. |
| `app/not-found.tsx` | 404 request-time melalui connection(); mencegah negative result tersimpan sebagai static s-maxage satu tahun. |
| `next.config.ts` | skipProxyUrlNormalize agar Proxy menerima header RSC asli; matcher tetap hanya detail kendaraan. |
| `proxy.ts` | Gate GET/HEAD sebelum render; HTML rewrite ke branded 404; RSC/HEAD negative response tanpa Flight buatan; no-store/noindex. |
| `server/storefront/vehicle-publication-gate.ts` | Server-only, validasi slug, predicate legacy AVAILABLE yang sama, select ID saja; error bukan not-found. |
| `scripts/verify-vehicle-http-status.mjs` | Integration checker read-only: enam fixture × HTML/RSC/HEAD, transport status, negative cache/noindex, private-marker denial. |
| `tests/vehicle-publication-gate.test.ts` | Empat unit test predicate, malformed slug dan error boundary; bukan bukti PostgreSQL. |
| `tests/vehicle-http-proxy.test.ts` | Tujuh unit test/config assertions, rewrite, no-store, RSC/HEAD dan mutation bypass. |
| `tests/storefront-scope.test.ts` | Regresi metadata now throws Next 404 untuk excluded inventory. |
| `docs/AUTOMOTIVE_STANDALONE_S5_QA_MATRIX.md` | Current S5.1 evidence dan superseded S5 findings. |
| `docs/AUTOMOTIVE_STANDALONE_RELEASE_BLOCKERS.md` | RB-04 locally resolved; customer gates tetap BLOCKED. |
| `docs/AUTOMOTIVE_STANDALONE_S5_1_IMPLEMENTATION_REPORT.md` | Laporan implementasi dan batas sertifikasi. |


## 7. Validation commands dan hasil akhir

| Command/test | Hasil | Evidence class |
|---|---|---|
| `pnpm exec prisma validate` | PASS | Actual CLI exit 0 |
| `pnpm db:generate` | PASS | Prisma Client 6.19.0 generated |
| `pnpm lint` | PASS | Exit 0 |
| `pnpm exec next typegen` | PASS | Route types generated |
| `pnpm typecheck` | PASS | Exit 0 |
| `pnpm test` | PASS — 435/435, 38 files | Unit/mock/static regression; 11 added tests across 2 files, existing metadata regression updated |
| `pnpm build` | PASS | Actual webpack production build; normal production env (not just staging override); dynamic `_not-found` and Proxy emitted |
| `git diff --check` | PASS | Whitespace validation |
| `prisma migrate deploy` | PASS — 6/6 | Disposable PostgreSQL only; no migration added/changed |
| Built HTTP status checker | PASS — 18/18 | Real PostgreSQL + production HTTP, not mocks |
| Unauthorized response-body checker | PASS — 21/21 | Real built HTTP responses; anonymous only |
| Expanded browser journey | PASS — 12/12 checkpoints | Real browser, three viewport groups, production build, disposable PG and HTTPS ingress |
| Publication-revocation browser navigation | PASS — 1/1 | Real browser; expected RSC fallback to HTML 404 |
| Media ingress checks | PASS — 10/10 before restart and 10/10 after restart | Actual Nginx HTTPS/bytes/digests, not static template review |

Totals are separate evidence classes and are not combined into a misleading single integration-test count. Earlier failed experiments were corrected and affected validation re-run; no previous report is used as a substitute for execution.

## 8. Re-running the committed HTTP checker

Provide a running disposable production build and six seeded fixture slugs through `VEHICLE_HTTP_BASE_URL`, `VEHICLE_HTTP_AVAILABLE_SLUG`, `VEHICLE_HTTP_UNKNOWN_SLUG`, `VEHICLE_HTTP_DRAFT_SLUG`, `VEHICLE_HTTP_SOLD_SLUG`, `VEHICLE_HTTP_REGISTERED_SLUG`, and `VEHICLE_HTTP_MIXED_SLUG`; optionally `VEHICLE_HTTP_PRIVATE_MARKER`. Run `node scripts/verify-vehicle-http-status.mjs`. The script performs only GET/HEAD, does not seed or connect to a database, and fails if a required fixture is omitted. Prepare fixtures using an authorized disposable database; never repurpose customer data.

## 9. Remaining blockers dan release decision

| Item | Status | Required next evidence |
|---|---|---|
| Streamed not-found for stable excluded records | RESOLVED locally | Re-run committed checker after future Next upgrades and on candidate host |
| Gate/render concurrency snapshot | LIMITATION | No stale server cache; page recheck retained; an atomic transport guarantee for a mid-request publication change is not claimed |
| Generic DB outage status | LIMITATION | Existing generic noindex error UI still 200; outage monitoring must not rely only on HTTP 200 health |
| Browser combinations not executed | NOT TESTED | Full customer UAT and remaining viewport/feature combinations |
| VPS/systemd UID/GID/firewall and recovery | BLOCKED | Actual isolated customer candidate host |
| DNS, public TLS chain, strict SNI/unknown-host acceptance | BLOCKED | Real customer hostname and ingress |
| Customer DB/media/config backup restore and RTO/RPO | BLOCKED | Authorized recovery drill, separate restore targets |
| Historical customer data/media compatibility | BLOCKED | Read-only customer snapshot preflight |
| Application readiness | **PASS WITH LIMITATIONS** | Local source/runtime/security checks above pass |
| Customer infrastructure readiness | **BLOCKED** | Customer host not verified |
| Commercial release readiness | **BLOCKED** | No automatic commercial release approval |
| Final Stage S5.1 verdict | **PASS WITH LIMITATIONS** | Local remediation/QA complete with explicit infra and coverage limits |

No commit is made to main. Delivery is the feature-branch commit and PR to main, reported after publication. No merge, deployment, DNS/certificate change, customer/staging database access, or SaaS activation is authorized or performed in S5.1.
