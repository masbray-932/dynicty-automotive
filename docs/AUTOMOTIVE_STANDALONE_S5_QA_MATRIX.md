# Dynicty Automotive — Stage S5 QA matrix

Tanggal verifikasi: 7 November 2026 (WIB)

Baseline: `fbfbece82cd468e91d0bbe7946aba1e72ac2215c`

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
| APP-007 | Regression | Seluruh Vitest | Vitest 5.0.0 | Semua lulus | 36 file, 424 tes PASS | PASS | Critical | — |
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
| APP-027 | UI CRUD | CRUD, branding, CMS melalui kontrol browser | Browser nyata | Seluruh interaksi visual selesai | Login dan navigasi diuji; rangkaian CRUD/upload/editor penuh tidak dijalankan di browser | NOT TESTED | High | Wajib pada host kandidat sebelum handoff |
| SEC-001 | Authorization | Admin tanpa session | Built HTTP | Redirect/tolak sebelum data query | Guard halaman/action dan non-leakage regresi PASS | PASS | Critical | — |
| SEC-002 | Ownership | Legacy vs registered inventory | PostgreSQL disposable | Tidak ada cross-dealer read/write | Fixture legacy/owned/mixed dan empat FK cross-owner negatif ditolak | PASS | Critical | — |
| SEC-003 | Origin/host | Server Action origin | Built HTTP | Origin asing ditolak | Origin negatif dan CSRF action terverifikasi | PASS | Critical | — |
| SEC-004 | Upload | MIME, magic bytes, size, traversal | Unit + built HTTP | Berkas tidak aman ditolak | JPEG/PNG/WEBP valid; invalid/truncated/oversized/path ditolak | PASS | Critical | — |
| SEC-005 | Secrets | Response/log/source scan | Build/runtime | Tidak ada secret | Tidak ada password/token/DB URL pada response; `.env` tidak ditrack | PASS | Critical | — |
| SEO-001 | Metadata | Canonical/metadata public | Built HTTP | Berasal dari configured origin | Canonical/metadata menggunakan `NEXT_PUBLIC_SITE_URL`; host request tidak memilih dealer | PASS | High | — |
| SEO-002 | Sitemap/robots | Hanya legacy AVAILABLE | Built HTTP + PostgreSQL | Hidden/foreign/admin tidak masuk | Robots dan sitemap lulus; 13 AVAILABLE legacy menjadi kandidat publik | PASS | Critical | — |
| SEO-003 | Hidden detail | DRAFT/SOLD/unknown tidak membocorkan data | Browser + built HTTP | Not-found + noindex, tanpa data | Ketiga kasus menampilkan not-found; matriks HTTP juga menemukan noindex, tanpa canonical/vehicle content | PASS | Critical | — |
| SEO-004 | Hidden detail status | Transport HTTP untuk not-found | Next production streaming | HTTP 404 | DRAFT, SOLD, foreign, mixed, missing dan malformed mengembalikan HTTP 200 setelah stream dimulai, dengan marker not-found/noindex | FAIL | High | Desain pre-stream availability gate jika transport 404 wajib; jangan rewrite proxy berdasarkan body |
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
| COM-001 | Application | Regression/build/security inti | Local disposable | Lulus dengan satu defect transport status dan browser CRUD belum lengkap | PASS | High | Catat sebagai **PASS WITH LIMITATIONS** |
| COM-002 | Customer host | Domain, TLS, systemd, ingress, backup/restore | Tidak tersedia | Tidak ada bukti host pelanggan | BLOCKED | Critical | Jalankan S4 checklist pada kandidat |
| COM-003 | Browser acceptance | Full operator onboarding/CRUD/media/CMS | Browser lokal tersedia | Responsive/login PASS; workflow operator lengkap belum diuji browser | NOT TESTED | Critical | UAT penuh sebelum customer handoff |
| COM-004 | Certification | Commercial release approval | Gabungan | Acceptance customer-host belum ada | BLOCKED | Critical | Dilarang menyebut production ready |

## Ringkasan gate

| Gate | Verdict | Dasar |
|---|---|---|
| Application readiness | **PASS WITH LIMITATIONS** | Build/regression/security/DB/browser smoke lulus; HTTP 200 streaming not-found dan full browser CRUD tersisa |
| Customer infrastructure readiness | **BLOCKED** | Tidak ada customer host untuk systemd, DNS, public TLS dan end-to-end ingress |
| Commercial release readiness | **BLOCKED** | Customer-host validation diwajibkan oleh Stage S5 |
