# Dynicty Automotive — Stage S5 QA matrix

Tanggal S5: 7 November 2026 (WIB). Update S5.1: 9 November 2026 (WIB).

Baseline historis S5: `fbfbece82cd468e91d0bbe7946aba1e72ac2215c`. Baseline S5.1: `740b36ce562009949572b10dc52a19b84c232e81`.

Evidence S5 dipertahankan sebagai riwayat. Tabel appendix S5.1 di bawah merupakan evidence terkini untuk remediation, browser expansion, HTTP dan media ingress disposable; tidak mensertifikasi host pelanggan.

Status berarti: **PASS** telah dieksekusi dengan bukti yang disebutkan; **FAIL** menghasilkan perilaku yang salah; **BLOCKED** memerlukan infrastruktur yang tidak tersedia; **NOT TESTED** belum dieksekusi. Build yang lulus tidak menggantikan verifikasi runtime.

## A. Application-level readiness

| Test ID | Komponen | Skenario | Lingkungan | Hasil yang diharapkan | Hasil aktual dan bukti | Status | Severity | Remediasi |
|---|---|---|---|---|---|---|---|---|
| APP-001 | Baseline | Source berasal dari `main` yang diminta | Git/GitHub | SHA sama | `git ls-remote` dan checkout sama-sama menunjukkan `fbfbece…` | PASS | Critical | — |
| APP-002 | Dependencies | Instalasi lockfile | pnpm 11.25.0 | Lockfile diterima | `pnpm install --frozen-lockfile`; 548 entri lolos pemeriksaan supply-chain | PASS | High | — |
| APP-003 | Prisma | Validasi schema | Prisma 6.19.0 | Valid | `prisma validate` exit 0 | PASS | Critical | — |
| APP-004 | Prisma | Client generation | Prisma 6.19.0 | Berhasil | `prisma generate` exit 0 | PASS | High | — |
| APP-005 | Type safety | Next typegen + TypeScript | Next 16.3.5 / TS 5.9.3 | Berhasil | Keduanya exit 0 | PASS | High | — |
| APP-006 | Static QA | ESLint | ESLint 9.39.5 | Tidak ada error | Exit 0 | PASS | High | — |
| APP-007 | Regression | Seluruh Vitest | Vitest 5.0.0 | Semua lulus | S5.1: 38 file, 435 tes PASS (sebelumnya S5: 424) | PASS | Critical | — |
| APP-008 | Build | Production webpack build | Next 16.3.5 | Berhasil | Compile, typecheck, 15 static pages, trace selesai; exit 0 | PASS | Critical | — |
| APP-009 | Migration | Seluruh riwayat ke DB kosong | PostgreSQL 17.11 disposable | Enam migrasi terpasang | `prisma migrate deploy` memasang 6/6 migrasi | PASS | Critical | — |
| APP-010 | Seed | Data dan admin sintetis | PostgreSQL disposable | 15 mobil dan satu admin | Staging seed selesai; 13 AVAILABLE, 1 DRAFT, 1 SOLD | PASS | High | — |
| APP-011 | Public | Homepage | Chromium 156, 390/768/1280 px | Render, HTTP 200, tanpa overflow | Tiga viewport PASS; tidak ada page/console error | PASS | High | — |
| APP-012 | Public | Catalog | Chromium 156, 390/768/1280 px | Render, HTTP 200, tanpa overflow | Tiga viewport PASS | PASS | High | — |
| APP-013 | Public | Detail AVAILABLE | Chromium 156, 390/768/1280 px | Render, HTTP 200, tanpa overflow | `toyota-avanza-preview-1` PASS di tiga viewport | PASS | High | — |
| APP-014 | Public | About/profile | Chromium 156, 390/768/1280 px | Render, HTTP 200, tanpa overflow | Tiga viewport PASS | PASS | Medium | — |
| APP-015 | Catalog | Search/filter/sort/pagination dan batas ownership | Built HTTP + PostgreSQL disposable | Hanya legacy AVAILABLE | Search, kondisi, brand/model, harga/tahun, transmisi, sort, count dan pagination terverifikasi; record owned/hidden tidak masuk | PASS | Critical | — |
| APP-016 | Detail | Gallery, related, contact/WhatsApp | Built HTTP + fixture media | Data tetap legacy dan AVAILABLE | Detail, related, contact serta URL media tervalidasi; foreign/mixed record ditolak | PASS | Critical | — |
| APP-017 | Admin auth | Login salah generik | Browser | Tidak membocorkan akun | Pesan “Email atau kata sandi tidak sesuai.” | PASS | Critical | — |
| APP-018 | Admin auth | Login benar dan dashboard | Browser + PostgreSQL | Session terbentuk | Dashboard menampilkan hitungan 15/13/1/1 | PASS | Critical | — |
| APP-019 | Session | Atribut cookie | Browser context | HttpOnly, Secure, SameSite | `HttpOnly=true`, `Secure=true`, `SameSite=Lax` | PASS | Critical | — |
| APP-020 | Admin responsive | Dashboard/cars/settings/content | Chromium 156, 390/768/1280 px | HTTP 200, tanpa overflow | 12 kombinasi PASS | PASS | High | — |
| APP-021 | Admin cars | Query parameter `q/status` berulang | Browser + real DB | Tetap render dan memakai nilai pertama | `/admin/cars?q=Preview&q=ignored&status=AVAILABLE&status=SOLD` render tanpa application error | PASS | High | — |
| APP-022 | Admin cars | Query berulang sebelum perbaikan | Built runtime baseline | Tidak crash | Baseline menghasilkan streamed render error pada HTTP 200 | FAIL | High | Diperbaiki S5 lewat normalisasi scalar, trim, batas 100 karakter, dan enum allowlist |
| APP-023 | Admin CRUD | Create/update/delete mobil, brand/model | Built HTTP + PostgreSQL disposable | Mutasi terotorisasi dan terisolasi | Create/update/delete serta brand/model sintetis PASS; cleanup terverifikasi | PASS | Critical | — |
| APP-024 | Media | Upload, primary, reorder, delete | Built HTTP + PostgreSQL + filesystem disposable | Validasi dan cleanup aman | Content/size/path traversal/namespace, cover, reorder, delete dan cleanup DB failure PASS | PASS | Critical | — |
| APP-025 | Settings | Profil, warna, logo | Built HTTP + PostgreSQL disposable | Validasi, persistence, cleanup | Nilai valid tersimpan; CSS/URL/SVG tidak aman ditolak; logo diganti/dihapus dan file lama dibersihkan | PASS | Critical | — |
| APP-026 | CMS | Banner/profile/FAQ/advantage/leasing | Built HTTP + PostgreSQL disposable | CRUD/publish dan inactive hiding | Jenis konten tersebut diverifikasi termasuk penyembunyian inactive | PASS | High | — |
| APP-027 | UI CRUD | Alur Admin terpilih melalui browser | Chromium 156 / PostgreSQL 17.11 disposable, 1280 px | Mutasi melalui kontrol UI dan hasil persisten | 18 checkpoint PASS: branding/cancel/focus, profil/logo, CMS profile/FAQ, brand/model, vehicle validation/create/price/images/delete/logout; lihat appendix evidence | PASS | High | Ulangi melalui ingress kandidat; coverage bukan seluruh kombinasi CMS/media |
| APP-028 | Media bytes | Media melalui disposable HTTPS ingress | Nginx 1.26.3 + production Next + PG 17.11 | Bytes/MIME sesuai, replacement/delete/persistence aman | Vehicle/banner SHA-256 cocok dengan stored file; logo WebP valid; 10 checks sebelum/sesudah restart PASS | PASS | High | Customer ingress tetap BLOCKED; lihat S5.1 report |
| SEC-001 | Authorization | Admin tanpa session | Built HTTP | Redirect/tolak sebelum data query | Guard halaman/action dan non-leakage regresi PASS | PASS | Critical | — |
| SEC-002 | Ownership | Legacy vs registered inventory | PostgreSQL disposable | Tidak ada cross-dealer read/write | Fixture legacy/owned/mixed dan empat FK cross-owner negatif ditolak | PASS | Critical | — |
| SEC-003 | Origin/host | Server Action origin | Built HTTP | Origin asing ditolak | Origin negatif dan CSRF action terverifikasi | PASS | Critical | — |
| SEC-004 | Upload | MIME, magic bytes, size, traversal | Unit + built HTTP | Berkas tidak aman ditolak | JPEG/PNG/WEBP valid; invalid/truncated/oversized/path ditolak | PASS | Critical | — |
| SEC-005 | Secrets | Response/log/source scan | Build/runtime | Tidak ada secret | Tidak ada password/token/DB URL pada response; `.env` tidak ditrack | PASS | Critical | — |
| SEO-001 | Metadata | Canonical/metadata public | Built HTTP | Berasal dari configured origin | Canonical/metadata menggunakan `NEXT_PUBLIC_SITE_URL`; host request tidak memilih dealer | PASS | High | — |
| SEO-002 | Sitemap/robots | Hanya legacy AVAILABLE | Built HTTP + PostgreSQL | Hidden/foreign/admin tidak masuk | Robots dan sitemap lulus; 13 AVAILABLE legacy menjadi kandidat publik | PASS | Critical | — |
| SEO-003 | Hidden detail | DRAFT/SOLD/unknown tidak membocorkan data | Browser + built HTTP | Not-found + noindex, tanpa data | Ketiga kasus menampilkan not-found; matriks HTTP juga menemukan noindex, tanpa canonical/vehicle content | PASS | Critical | — |
| SEO-004 | Hidden detail status | Transport excluded inventory | Production Next 16.3.5 + PG 17.11 | HTTP 404 tanpa stale negative cache | S5 baseline 200; S5.1 final unknown/DRAFT/SOLD/registered/mixed masing-masing HTML/RSC/HEAD 404 + no-store/noindex; AVAILABLE 200 | PASS | High | Re-run pada candidate customer; race gate/render tetap limitation |
| CACHE-001 | Tenant boundary | Cache/canonical tidak memakai raw Host | Source + regression | Tidak ada pemilihan dealer dari header | Registered storefront tetap nonaktif; origin dari env | PASS | Critical | — |

## B. Customer infrastructure readiness

| Test ID | Komponen | Skenario | Lingkungan | Hasil yang diharapkan | Hasil aktual dan bukti | Status | Severity | Remediasi |
|---|---|---|---|---|---|---|---|---|
| INF-001 | Package | Dua konfigurasi instalasi terpisah | S4 disposable templates | UID/path/port/DB/media/secret berbeda | Template Alpha/Bravo terisolasi dan tervalidasi | PASS | Critical | — |
| INF-002 | PostgreSQL | Role least privilege dan DB isolation | PostgreSQL 17.11 disposable | Cross-connect/DDL ditolak | Dua DB/role terpisah; migrasi 6/6; cross-connect dan schema DDL ditolak | PASS | Critical | — |
| INF-003 | Backup | DB/media/config backup terenkripsi | Disposable | Dapat dipulihkan | `pg_dump`/`pg_restore` 17.11 + age 1.2.1; digest DB/media/config cocok pada DB ketiga | PASS | Critical | — |
| INF-004 | Nginx | TLS loopback, host/SNI, proxy, upload/media | Nginx 1.26.3 disposable | Policy S4 bekerja | Syntax, 308, default reject, SNI/Host mismatch, forwarding, 413, MIME/nosniff, symlink/method denial PASS | PASS | Critical | — |
| INF-005 | Media | Persist setelah release pointer berubah | Disposable filesystem/Nginx | Media tetap ada | Forward release switch mempertahankan media | PASS | High | — |
| INF-006 | systemd | Validasi unit | `systemd-analyze verify` | Unit valid | Static verification PASS | PASS | Medium | — |
| INF-007 | systemd runtime | Start/restart/failure recovery/UID permission | Customer-like host | Aktual berjalan | PID 1 bukan systemd; tidak dapat dieksekusi | BLOCKED | Critical | Jalankan checklist pada VPS kandidat |
| INF-008 | Public TLS/DNS | Domain pelanggan dan chain publik | Customer host | DNS/TLS/HTTPS valid | Host pelanggan tidak tersedia | BLOCKED | Critical | Provision domain, DNS, certificate dan verifikasi eksternal |
| INF-009 | Real ingress | Next + Nginx + customer filesystem end-to-end | Customer host | Upload/action/cookie/client IP pass | Nginx dan app diuji secara terpisah, bukan customer chain final | BLOCKED | Critical | Smoke test melalui hostname kandidat |
| INF-010 | Customer restore | Restore pada target operasional | Customer-like host | RTO/RPO tercatat | Restore disposable PASS; RTO/RPO customer belum diukur | BLOCKED | High | Drill pada lingkungan customer terisolasi |

## C. Commercial release readiness

| Test ID | Komponen | Skenario | Lingkungan | Hasil aktual | Status | Severity | Remediasi |
|---|---|---|---|---|---|---|---|
| COM-001 | Application | Regression/build/security inti | Local disposable S5.1 | 435 regression tests, 18 status checks, 21 auth checks, browser/media expansion PASS | PASS | High | Application verdict tetap PASS WITH LIMITATIONS |
| COM-002 | Customer host | Domain, TLS, systemd, ingress, backup/restore | Tidak tersedia | Tidak ada bukti host pelanggan | BLOCKED | Critical | Jalankan S4 checklist pada kandidat |
| COM-003 | Browser acceptance | Full operator onboarding/CRUD/media/CMS | Browser lokal tersedia | Responsive/login dan 18 checkpoint desktop Admin PASS; seluruh jenis CMS, format/ukuran media, dan workflow mobile interaktif belum lengkap | NOT TESTED | Critical | UAT penuh sebelum customer handoff |
| COM-004 | Certification | Commercial release approval | Gabungan | Acceptance customer-host belum ada | BLOCKED | Critical | Dilarang menyebut production ready |

## Ringkasan gate

| Gate | Verdict | Dasar |
|---|---|---|
| Application readiness | **PASS WITH LIMITATIONS** | S5.1 menutup stable excluded HTTP status dan local media/browser gaps; full combinations/customer QA dan race/outage limitations tetap dicatat |
| Customer infrastructure readiness | **BLOCKED** | Tidak ada customer host untuk systemd, DNS, public TLS dan end-to-end ingress |
| Commercial release readiness | **BLOCKED** | Customer-host validation diwajibkan oleh Stage S5 |

## Appendix — lanjutan browser Admin pada PR #16

| Item | Evidence |
|---|---|
| Source yang diuji | PR HEAD `28ff64a9ad07e4b308c8d3c36274ae47ff66dac3`; tree `529d648696c22f362a34a1389497ccda68cfd2fb` sama dengan tree lokal yang dibuild |
| Runtime | Production build S5, Chromium Headless Shell 156.0.8078.47, Playwright 1.57.0, 1280×900, loopback `127.0.0.1:3109` |
| Database | PostgreSQL 17.11 cluster baru; enam migrasi; staging seed sintetis, bukan staging eksternal |
| Environment limitation | Sandbox membatasi Unix sockets/network-interface enumeration. Seed memakai `node --import tsx`; test-only `networkInterfaces` shim di luar repository hanya menyediakan loopback agar Next start. Tidak ada auth/origin/storage guard yang diubah |
| Eksekusi | Final journey exit 0, 18 checkpoint PASS, 0 uncaught browser page errors |
| Media limitation | Upload, cover, ordering dan delete action/UI diverifikasi. Tes ini tidak menyatakan decode bytes melalui customer ingress sudah lulus |
| Scope | Desktop operator journey; matriks responsive sebelumnya tetap terpisah. Bukan full WCAG/cross-browser/customer acceptance |

| Checkpoint | Observasi aktual | Status |
|---|---|---|
| Login | Session valid menuju Dashboard | PASS |
| Branding batal | Escape menutup dialog, fokus kembali ke tombol, reload mempertahankan warna awal | PASS |
| Branding simpan | Reload mempertahankan `#2563EB`; computed storefront `--color-primary` sama | PASS |
| Profil dealer | Nama berubah melalui dialog; storefront menampilkan nama baru | PASS |
| Logo | Upload PNG, replacement, confirmed removal; UI kembali “Belum ada logo.” | PASS |
| CMS profile | Welcome diaktifkan; heading baru muncul di homepage | PASS |
| FAQ publish | Pertanyaan/jawaban aktif tersimpan dan terlihat publik | PASS |
| FAQ delete | Confirmed delete menghilangkan FAQ dari homepage | PASS |
| Rename brand batal | Dialog old/new tampil; reload mempertahankan nama lama setelah Batal | PASS |
| Brand/model | Rename confirmed lalu pembuatan model tersimpan dan muncul sebagai pilihan mobil | PASS |
| Validation recovery | Harga invalid ditolak server; varian/harga tetap terisi; `aria-invalid=true` | PASS |
| Create/publish vehicle | Confirm Publikasikan menuju edit page kendaraan baru | PASS |
| Critical price | Confirm update; reload mempertahankan harga 210000000 | PASS |
| Image workflow | Dua PNG terunggah; cover berpindah ke ID gambar kedua; reorder membuat ID tersebut di posisi pertama | PASS |
| Image delete | Confirm delete mengurangi daftar dari dua menjadi satu | PASS |
| Vehicle delete | Batal mempertahankan row; confirm menghapus row dari daftar | PASS |
| Logout | Tanpa dialog; protected `/admin` kembali ke login | PASS |
| Browser runtime | Tidak ada uncaught page error selama final journey | PASS |

## Appendix — Stage S5.1 current execution evidence

| Fixture | Baseline HTML | S5.1 HTML | S5.1 RSC | S5.1 HEAD | Hasil |
|---|---|---|---|---|---|
| AVAILABLE legacy — `toyota-avanza-preview-1` | 200 | 200 | 200 | 200 | PASS |
| Unknown — `unknown-vehicle` | 200 | 404 | 404 | 404 | PASS |
| DRAFT — `honda-brio-preview-14` | 200 | 404 | 404 | 404 | PASS |
| SOLD — `suzuki-xl7-preview-15` | 200 | 404 | 404 | 404 | PASS |
| Registered — `registered-qa-car` | 200 | 404 | 404 | 404 | PASS |
| Mixed owner — `mixed-ownership-qa-car` | 200 | 404 | 404 | 404 | PASS |

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

| Additional check | Evidence | Status |
|---|---|---|
| Cache freshness | AVAILABLE → SOLD → AVAILABLE = 200 → 404 → 200, no restart | PASS |
| Revoked client navigation | RSC 404 → normal HTML 404, branded not-found; 0 uncaught page error | PASS |
| Origin/cookie | Forged origin rejected (500); HttpOnly/Secure/SameSite=Lax host-only cookie | PASS disposable |
| Admin non-leakage | 21 anonymous HTML/RSC/prefetch responses | PASS |
| Media restart | Same 10 checks re-run after app restart, matching SHA-256 | PASS disposable |
| Browser runtime | 0 unexpected errors; deliberate deleted-logo 404 recorded separately | PASS |
| Full feature × viewport cross-product / cross-browser / full WCAG | Not executed in S5.1 | NOT TESTED |
| Customer hostname, public TLS/SNI, systemd runtime, customer recovery | No customer infrastructure accessed | BLOCKED |

Full methods, scope, changed files and limitations: `docs/AUTOMOTIVE_STANDALONE_S5_1_IMPLEMENTATION_REPORT.md`.
