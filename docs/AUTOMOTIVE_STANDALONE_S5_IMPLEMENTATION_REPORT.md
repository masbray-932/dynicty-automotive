# Dynicty Automotive — Stage S5 implementation report

## 1. Baseline dan ruang lingkup

| Item | Hasil |
|---|---|
| Repository | `masbray-932/dynicty-automotive` |
| Verified `main` | `fbfbece82cd468e91d0bbe7946aba1e72ac2215c` |
| Branch | `feat/automotive-standalone-s5-production-qa` |
| Source | Checkout bersih dari GitHub; S2, S3 dan S4 reports serta kontrak/runbook dibaca |
| Perubahan infrastruktur | Tidak ada production/staging/DNS/certificate/customer database yang diubah |

## 2. Lingkungan pengujian

| Komponen | Versi/kondisi |
|---|---|
| Node | 24.22.1 |
| Next / React | 16.3.5 / 19.2.8 |
| Prisma | 6.19.0 |
| PostgreSQL | 17.11, cluster disposable, trust hanya pada network namespace QA |
| Browser | Chromium Headless Shell 156.0.8078.47 + Playwright 1.57.0 |
| Viewport | 390 × 900, 768 × 900, 1280 × 900 |
| Nginx / backup | Nginx 1.26.3; PostgreSQL tools 17.11; age 1.2.1 pada disposable deployment drill |
| Data | Staging seed sintetis: 15 mobil, satu admin sementara, tidak ada data customer |

## 3. Defect yang diperbaiki

`/admin/cars` menerima `searchParams` sebagai scalar pada tipe TypeScript, tetapi Next dapat mengirim `string[]` untuk parameter berulang. Nilai array diteruskan ke Prisma `contains`, sehingga RSC gagal render sementara shell tetap HTTP 200.

Perbaikan:

- ambil nilai pertama secara deterministik untuk `q`, `status`, dan `notice`;
- trim dan batasi pencarian ke 100 karakter;
- pertahankan enum allowlist untuk status;
- set `maxLength=100` sebagai bantuan UI;
- tambah regresi yang membuktikan nilai kedua tidak mencapai Prisma dan ownership predicate tetap ada.

Browser nyata membuktikan URL berulang sekarang menampilkan “Kelola Mobil” tanpa application error.

## 4. Verifikasi fitur

| Area | Bukti | Hasil |
|---|---|---|
| Public | Homepage, catalog, AVAILABLE detail dan about pada tiga viewport; tidak ada overflow/console error | PASS |
| Catalog/data isolation | Filter/sort/pagination/count terhadap fixture legacy, hidden, owned dan mixed | PASS |
| Admin auth | Login invalid generik, login valid, dashboard real count | PASS |
| Cookie | HttpOnly, Secure, SameSite=Lax | PASS |
| Admin responsive | Dashboard, cars, settings, content pada tiga viewport | PASS |
| CRUD/media/settings/CMS | Built HTTP + PostgreSQL disposable; auth, validation, file cleanup dan ownership checks | PASS |
| Full visual operator workflow | CRUD/upload/editor lengkap belum dieksekusi melalui browser | NOT TESTED |
| Registered storefront | Tetap tidak aktif; tidak ada host/client input yang mengaktifkannya | PASS |

## 5. Security findings

| Boundary | Hasil |
|---|---|
| Unauthorized Admin/data leakage | Guard dan regresi lulus |
| Origin/CSRF | Origin asing ditolak; normal Server Actions dipertahankan |
| Cross-dealer | Foreign/owned/mixed tidak masuk legacy reads; empat relasi cross-owner ditolak PostgreSQL |
| Upload | MIME/magic/size/path/namespace/cleanup checks lulus |
| Secrets | Tidak ada `.env`, credential atau fixture password pada perubahan Git |
| Host identity | Inventory tidak dipilih dari raw Host/X-Forwarded-Host; ingress allowlist tetap kewajiban deployment |

## 6. HTTP 200 / not-found investigation

Matriks production runtime menguji DRAFT, SOLD, foreign-owned, mixed-owned, missing dan malformed slug dengan user agent browser dan crawler. Semua response:

- menampilkan not-found;
- menyertakan noindex/Next not-found marker;
- tidak memuat canonical kendaraan atau data kendaraan tersembunyi;
- tetap berstatus HTTP 200 karena response sudah mulai di-stream sebelum `notFound()` diputuskan.

Dokumentasi Next 16.3.5 yang terpasang juga menjelaskan perbedaan 200 untuk streamed not-found dan 404 untuk non-streamed not-found. Tidak ditemukan koreksi minimal yang aman tanpa memindahkan availability/ownership lookup sebelum stream dan mendefinisikan ulang cache serta DB-error behavior. Proxy rewrite berbasis fragmen body ditolak karena rapuh. Status transport dicatat **FAIL**, sedangkan non-leakage/noindex **PASS**.

## 7. Deployment validation

| Pemeriksaan | Hasil |
|---|---|
| Dua instalasi terisolasi | PASS pada template disposable |
| DB role/isolation/migration | PASS pada PostgreSQL 17.11 disposable |
| Encrypted backup/restore | PASS ke DB ketiga; checksum DB/media/config cocok |
| Nginx loopback HTTPS/Host/SNI/forwarding/upload/media | PASS pada disposable configuration |
| systemd unit syntax | PASS (`systemd-analyze verify`) |
| systemd runtime | BLOCKED; lingkungan QA tidak memakai systemd sebagai PID 1 |
| Public DNS/TLS/customer hostname | BLOCKED; tidak tersedia |
| Customer end-to-end ingress | BLOCKED |

## 8. Commands dan hasil

| Command/check | Hasil |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; 548 lock entries lolos policy |
| `pnpm exec prisma validate` | PASS |
| `pnpm db:generate` | PASS |
| `pnpm exec next typegen` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS — 424/424, 36 files |
| `pnpm build` | PASS |
| `pnpm db:migrate:deploy` pada PostgreSQL disposable | PASS — 6/6 migrations |
| Chromium production smoke | PASS untuk matriks yang dieksekusi; bukan full UAT |

## 9. File berubah

| File | Tujuan |
|---|---|
| `app/admin/(protected)/cars/page.tsx` | Normalisasi parameter pencarian/filter berulang |
| `tests/admin-page-auth.test.tsx` | Regresi query parameter array dan ownership predicate |
| `docs/AUTOMOTIVE_STANDALONE_S5_QA_MATRIX.md` | Evidence matrix |
| `docs/AUTOMOTIVE_STANDALONE_S5_IMPLEMENTATION_REPORT.md` | Laporan implementasi |
| `docs/AUTOMOTIVE_STANDALONE_RELEASE_BLOCKERS.md` | Daftar release blockers |

## 10. Verdict

| Gate | Verdict |
|---|---|
| Application readiness | **PASS WITH LIMITATIONS** |
| Customer infrastructure readiness | **BLOCKED** |
| Commercial release readiness | **BLOCKED** |

Alasannya tegas: regression, build, disposable PostgreSQL, security boundaries dan browser smoke lulus, tetapi transport 404 belum benar, full browser operator UAT belum selesai, serta customer hostname/systemd/public TLS/ingress/restore belum dapat diverifikasi. Tidak ada deployment atau commercial approval yang dilakukan.
