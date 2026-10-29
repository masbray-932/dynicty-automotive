# Automotive Stage 1 — Audit Kondisi Terkini

Tanggal audit: 8 Oktober 2026. Target: repository `dynicty-automotive`.

## 1. Metode dan batas bukti

Audit membaca source, schema, migration SQL, konfigurasi, serta status Git saat ini. Report fase sebelumnya hanya dibandingkan sebagai catatan historis, bukan bukti implementasi atau keberhasilan deployment. Tidak ada perubahan source, schema, migration, deployment, DNS, atau infrastruktur. Satu-satunya file yang dibuat adalah report ini.

`PRESENT` berarti implementasi tersedia di source; bukan berarti sudah lolos pengujian browser/live. `PARTIAL` berarti hanya sebagian target tersedia. `MISSING` berarti implementasi target tidak ditemukan. Status infrastruktur dibedakan dari kelengkapan source.

Audit ini tidak menjalankan ulang lint/typecheck/test/build, migrasi, seed, atau browser QA. Hasil command pada report lama tidak dinyatakan sebagai hasil audit ini.

## 2. Kondisi repository

| Pemeriksaan | Hasil |
| --- | --- |
| Nama repository | `dynicty-automotive` — sesuai |
| Direktori | `/workspace/scratch/422432a08072/dynicty-automotive` |
| Branch | `main` |
| HEAD | `69325e6c9e7a19c8e477e5420bf22e6ae70a959a` |
| Origin | `https://github.com/masbray-932/dynicty-automotive.git` |
| `origin/main` setelah fetch | `69325e6c9e7a19c8e477e5420bf22e6ae70a959a` |
| Ahead / behind | 0 / 0 |
| Status sebelum audit | Bersih; `git status --porcelain=v1` kosong |
| Phase 6/7 dan persiapan staging | Sudah masuk release commit; bukan lagi worktree uncommitted |

Commit relevan, terbaru dahulu:

| Commit | Isi |
| --- | --- |
| `69325e6` | `chore: prepare automotive staging release` |
| `b0af068` | Phase 5 administration |
| `35367e7` | Phase 4 car detail |
| `670fb25` | Phase 3 catalog |
| `b33ddcb` | Phase 2 homepage |
| `14a53fd` | Phase 1 admin CRUD |
| `a295608` | Phase 0 foundation |

Source fondasi fase 0–6 tersedia. Persiapan fase 7/staging tersedia, tetapi sertifikasi runtime/deployment tidak dapat diturunkan dari commit tersebut. Pernyataan “uncommitted” pada report deployment lama sudah tidak menggambarkan kondisi Git saat ini.

## 3. Arsitektur saat ini

| Area | Implementasi source | Batasan |
| --- | --- | --- |
| Framework | Next.js `16.3.5`, App Router; React `19.2.8` | Audit source, bukan runtime |
| Database | Prisma/client `6.19.0`; datasource PostgreSQL | Tidak ada koneksi DB audit yang tersedia |
| Public rendering | Server Components, DB-backed routes memakai `connection()` | Konten utama dinamis; bukan cache halaman permanen |
| Request deduplication | React `cache()` pada pembacaan dealer/detail | Tidak sama dengan shared cache lintas request |
| Mutasi | Server Actions dan validasi server | Aksi admin memeriksa `requireAdmin()` secara mandiri |
| Auth | bcrypt; token acak 32 byte; digest HMAC-SHA256 disimpan server-side | Admin global untuk satu aplikasi/dealer |
| Session | Masa berlaku 7 hari; cookie HttpOnly, SameSite=lax, Secure saat production, tanpa Domain | Tidak ada pemisahan tenant |
| Session cleanup | Cleanup terbatas 100 session expired pada pembuatan session; penolakan session expired | Efektivitas runtime DB belum diuji di sini |
| Login limiter | In-memory bounded map; 5 kegagalan, window 15 menit, cooldown 5 menit | Reset saat proses restart; tidak shared antar-instance |
| Storage | Abstraksi `StorageProvider`; local dan boundary R2 | R2 upload/delete belum diimplementasikan |
| Error/logging | Pesan public aman, fallback, error boundary, structured logger | Integrasi observability eksternal belum aktif |
| Deployment | Template env, systemd dan Nginx untuk production/preview | File contoh bukan bukti service terpasang |

Source utama: `package.json`, `db/client.ts`, `server/auth/*`, `server/env-schema.ts`, `server/log.ts`, `services/storage/*`, `next.config.ts`.

### Asumsi single-dealer

- `DealerSettings` dibaca dengan ID `default`; satu DATABASE_URL dan satu site URL untuk aplikasi.
- Admin, session, slug mobil, merek, dan media belum mempunyai `tenantId`.
- Tidak ada model Tenant, domain mapping, atau resolver dealer berdasarkan hostname.
- Branding berasal dari satu DealerSettings; subdomain lain saja tidak membuat dealer baru.
- ID default merupakan konvensi service/seed, bukan constraint DB yang melarang record DealerSettings lain.

Integrasi create-tenant Dynicty memerlukan tahap arsitektur terpisah; belum aman dianggap tersedia sekarang.

## 4. Inventori fitur public

| Fitur | Status | Temuan source |
| --- | --- | --- |
| Homepage `/` | PRESENT | Hero, quick search, NEW/USED, featured, merek, latest, benefit, CTA |
| Katalog `/cars` | PRESENT | Filter, sort, pagination, chips/reset dan empty/error state |
| Detail `/cars/[slug]` | PRESENT | Gallery, specs, description, breadcrumb, related cars, CTA |
| Company profile `/about` | MISSING | Tidak ada route atau konten profile terkelola |
| Pencarian mobil | PRESENT | GET ke katalog; kondisi, merek, model, keyword; katalog juga price/year/transmission |
| AVAILABLE-only kendaraan | PRESENT | Query Homepage, katalog, detail, related dan sitemap membatasi status AVAILABLE |
| WhatsApp | PRESENT | Nomor dinormalisasi, message encoded, trusted `https://wa.me`, central detail URL |
| Branding dealer | PARTIAL | Nama/logo/kontak/warna ada; company profile dan konten Homepage belum terkelola |
| SEO | PRESENT | Metadata Homepage/katalog/detail, canonical, Open Graph dan Vehicle JSON-LD |
| Sitemap | PRESENT | `/`, `/cars`, detail AVAILABLE; query detail dibatasi 5.000 |
| Robots | PRESENT | Public crawlable, admin disallow; staging disallow seluruh situs |

Katalog menggunakan page size 12, page input dibatasi hingga 1.000, serta filter yang diparse server-side. Metadata katalog berquery nonkosong termasuk parameter tidak dikenal menjadi noindex/follow dengan canonical `/cars`. Detail DRAFT/SOLD/unknown tidak ditemukan dan tidak menghasilkan metadata kendaraan tersembunyi. Vehicle JSON-LD berasal dari record AVAILABLE dan serialisasi menghindari injeksi tag script.

Catatan visibilitas: `server/homepage/service.ts#getBrands` mengambil maksimal 12 merek beserta seluruh modelnya, sementara hanya count kendaraan yang difilter AVAILABLE. Label merek/model tanpa kendaraan AVAILABLE masih dapat tampil di Homepage/quick search. Ini bukan kebocoran record kendaraan DRAFT/SOLD, tetapi tidak konsisten dengan opsi katalog yang mengikuti inventori public. Daftar model pada query Homepage juga belum dibatasi.

## 5. Homepage gap matrix

| Target section | Status | Kondisi sekarang / gap |
| --- | --- | --- |
| Main banner | PARTIAL | Ada hero visual placeholder; belum banner upload/slider terkelola |
| Welcome | PARTIAL | Copy hero tetap; belum judul/isi welcome dari admin |
| Car search | PRESENT | Kondisi, merek, model, keyword; price range hanya di katalog |
| Promo banner | MISSING | Card NEW/USED adalah navigasi kategori, bukan promo terkelola |
| Available cars | PRESENT | Featured dan latest AVAILABLE dengan batas jumlah |
| About us | MISSING | Tidak ada ringkasan tentang dealer atau link `/about` |
| Why choose us | PARTIAL | Empat benefit hardcoded; belum edit/order/visibility dari admin |
| Leasing partners | MISSING | Tidak ada data atau section logo partner |
| FAQ | MISSING | Tidak ada section/record/editor FAQ |
| Contact/footer | PARTIAL | CTA WA dan kontak ada; jam operasional, Maps/social rendering dan footer profile lengkap belum ada |

Hero sekarang berupa layout teks + placeholder, tinggi minimum 620px dan copy overlay pada gambar. Ini berbeda dari target banner gambar tanpa overlay text/button. Header memakai nama/logo dealer; footer berisi nama, navigasi katalog, dan copyright. Maps URL tersimpan di settings tetapi tidak diteruskan pada projection public dealer; social URL belum dirender pada footer.

Belum ada sistem visibility untuk otomatis menyembunyikan seluruh section opsional yang kosong. Beberapa section inventori justru menampilkan empty state; perilaku ini perlu diputuskan secara khusus, bukan diubah diam-diam.

## 6. Admin gap matrix

| Kemampuan | Status | Temuan |
| --- | --- | --- |
| Login/logout/protected routes | PRESENT | Auth server-side dan layout admin |
| Dashboard | PRESENT | Count total/status/condition/featured dan recent cars |
| Car CRUD | PRESENT | Create/edit/delete, status, featured, validasi field |
| Brand/model | PARTIAL | Create/edit tersedia; tidak ada aksi delete master data |
| Car images | PRESENT | Upload bertahap, primary, reorder, delete; storage compensation |
| DealerSettings | PRESENT | Nama, kontak, Maps/social URL, warna, logo |
| Banner management | MISSING | Belum upload, link, active, order, slider atau batas aktif |
| Welcome content | MISSING | Tidak ada form/field penyimpanan |
| Promo | MISSING | Tidak ada data/editor promo |
| About/showroom | MISSING | Tidak ada profile/showroom image/editor |
| Advantages | MISSING | Benefit public hardcoded |
| FAQ | MISSING | Tidak ada CRUD/order/visibility |
| Leasing partners | MISSING | Tidak ada pengelolaan logo partner |
| Operating hours | MISSING | Tidak ada field/form/rendering |

Source utama: `app/admin/(protected)/*`, `server/cars/actions.ts`, `server/master-data/actions.ts`, `server/settings/actions.ts`, `features/settings/dealer-settings-form.tsx`.

## 7. Banner gap matrix

Audit ini mengukur repository automotive terhadap kontrak target. Tidak mengklaim sudah membandingkan source repository storefront Dynicty dalam sesi audit ini.

| Perilaku target | Status | Gap |
| --- | --- | --- |
| Single upload per banner | MISSING | Tidak ada model, validator atau upload banner |
| Gambar yang sama desktop/tablet/mobile | MISSING | Placeholder memang satu asset, tetapi belum kontrak banner terkelola |
| Multiple slides | MISSING | Hero hanya satu visual tetap |
| Maksimal 5 aktif | MISSING | Belum validasi server atau query cap |
| Link banner | MISSING | CTA hero terpisah, bukan optional link gambar |
| Active/inactive | MISSING | Tidak ada state banner |
| Ordering | MISSING | Tidak ada sortOrder banner |
| Rasio 2:1 di bawah 1280px | MISSING | Tidak ada aturan rasio tersebut |
| Rasio 21:9 pada >=1280px | MISSING | Tidak ada aturan rasio tersebut |
| Landscape cover | MISSING | Belum renderer banner dengan deteksi orientasi |
| Portrait contain + blurred backdrop | MISSING | Blur dekoratif hero bukan backdrop dari gambar portrait |
| Autoplay 5 detik | MISSING | Tidak ada carousel/timer |
| Swipe | MISSING | Tidak ada gesture slide |
| Arrows | MISSING | Tidak ada kontrol carousel |
| Dots | MISSING | Tidak ada indikator slide |
| Keyboard | MISSING | Link hero bisa difokuskan; belum navigasi slide keyboard |
| Hide navigation ketika satu banner | MISSING | Belum kondisional carousel |
| Tanpa overlay text/button | MISSING | Hero saat ini memiliki copy overlay serta teks/CTA tetap |

Gallery mobil merupakan komponen berbeda; bukan implementasi banner Homepage. Storage/logo upload yang ada dapat menjadi fondasi, tetapi aturan banner perlu validator dan namespace tersendiri.

## 8. Schema dan migration saat ini

| Model | Peran |
| --- | --- |
| AdminUser | Akun global dan password hash |
| AdminSession | Digest token, relasi admin, expiry |
| Brand | Master merek; nama/slug unique global |
| CarModel | Model per merek; unique brandId/slug |
| Car | Kendaraan, kondisi, status, harga, spesifikasi dan featured |
| CarImage | Storage key, primary dan sortOrder per kendaraan |
| DealerSettings | Identitas/kontak/warna/logo dealer |

Migration SQL tersedia:

1. `20260913000000_phase_0_foundation`
2. `20260913010000_phase_1_primary_image_constraint`
3. `20260914000000_phase_6_query_hardening`

Schema memiliki indeks session expiry/digest, status/updatedAt mobil, condition/status, featured/status, brand/model, year/price dan image ordering. Migration Phase 1 menambahkan constraint partial unique satu primary image per mobil. Keberadaan file bukan bukti migration sudah diterapkan pada staging.

### Gap schema yang kemungkinan diperlukan untuk Stage 2

Ini rekomendasi desain, belum schema final dan belum migration:

| Entitas/field | Kebutuhan minimal |
| --- | --- |
| DealerContent atau tambahan DealerSettings | Welcome title/body, about summary/full body, visibility section; satu record profile per dealer settings |
| About/showroom media | Storage key dan alt text; optional media, jangan simpan absolute path user |
| Operating hours | Teks terstruktur sederhana dengan panjang terbatas; belum membutuhkan booking/scheduler |
| Banner | Owner settings, placement MAIN/PROMO, satu storageKey, alt, optional validated link, active, sortOrder, timestamps |
| Advantage | Title, description, active, sortOrder, owner |
| FAQ | Question, answer, active, sortOrder, owner |
| LeasingPartner | Nama, satu logoStorageKey, alt, active, sortOrder, owner; hanya logo partner, tanpa fitur pembiayaan |

Main banner: maksimal lima aktif, satu sumber gambar dan tanpa field mobile/desktop terpisah. Batas aktif perlu dijaga pada mutasi server dengan penanganan concurrency; public query juga dibatasi. Promo memakai placement terpisah agar tidak menghabiskan slot main banner. Jangan menyimpan klaim promosi atau partner fiktif sebagai default.

Gunakan relasi owner ke settings/profile dan migration additive agar tidak menambah tabel global tanpa ownership. Ini memudahkan migrasi berikutnya, tetapi belum menggantikan desain tenant isolation. Tidak perlu model Tenant/domain atau perubahan auth multi-tenant dalam Stage 2.

## 9. Staging: implementasi dibanding runtime

| Area | Implementasi repository saat ini | Bukti runtime saat audit |
| --- | --- | --- |
| Env staging | `.env.staging.example`, URL preview, dedicated DB placeholder, DEPLOYMENT_ENV=staging | Nilai env runtime tidak tersedia di workspace audit |
| PostgreSQL | Target DB terpisah dan migration workflow disiapkan | NOT VERIFIED; psql/pg_isready tidak tersedia |
| Seed admin/settings/inventori | `prisma/seed-staging.ts`; hashed admin; preview settings; 15 mobil/3 merek/3 model | Tidak dieksekusi dalam audit ini |
| Seed visibility | 13 AVAILABLE, 1 DRAFT, 1 SOLD; 3 featured dari 15 seeded cars | Ini isi source, bukan count DB live |
| Media lokal | `public/uploads`, staging opt-in dan key aman | Mount/persistence/permissions live NOT VERIFIED |
| R2 | publicUrl ada; put/delete melempar error reserved | Tidak siap untuk upload/delete; runtime NOT VERIFIED |
| Service | Template preview non-root, port `127.0.0.1:3101` | VPS/service target tidak dapat diakses dari sesi ini |
| Nginx | Dedicated preview config, forwarded headers ditimpa, TLS placeholder | nginx -t/reload/runtime NOT VERIFIED |
| DNS/SSL | Host preview ditulis dalam contoh config | Akses pengelolaan DNS/certificate tidak tersedia |
| Health | `/healthz` minimal status, tanpa DB check | Tidak memperoleh HTTP 200 aplikasi melalui preview |
| Staging noindex | Global header noindex/nofollow/noarchive + private/no-store; robots disallow / | Source PRESENT; header live NOT VERIFIED |
| Browser/CRUD QA | Route/form source tersedia | NOT VERIFIED pada staging dalam audit ini |

Pemeriksaan read-only `curl https://automotive-preview.dynicty.com/healthz` menghasilkan HTTP/2 502 dari `mitmproxy` dengan pesan `Certificate verify failed: certificate has expired`. Respons tersebut berasal dari perantara jaringan, bukan bukti HTTP 502 dari Next.js. Tidak cukup untuk menyatakan aplikasi staging mati, sertifikat origin tertentu kedaluwarsa, atau routing hostname benar. Tidak dilakukan bypass TLS.

Workspace audit tidak memiliki DATABASE_URL, SESSION_SECRET, site URL runtime, storage selection, kredensial R2, atau SSH_AUTH_SOCK yang diset. Keberadaan binary ssh/systemctl lokal bukan akses ke VPS. Status ini tidak membuktikan bahwa infrastruktur eksternal belum pernah disiapkan operator.

Noindex memakai DEPLOYMENT_ENV, bukan deteksi hostname otomatis. Staging harus dibangun dan dijalankan dengan environment staging yang konsisten; build produksi yang dipindah tanpa konfigurasi yang tepat tidak boleh diasumsikan membawa header staging. Sitemap masih dapat diakses sebagai route, tetapi staging robots tidak mengiklankannya dan header global menolak indexing.

## 10. Risiko dan perhatian

1. **R2 belum fungsional.** Production env menolak local storage; staging local hanya dengan opt-in. Mengisi env R2 saja tidak menyelesaikan upload/delete.
2. **Staging/live QA belum terverifikasi.** Jangan menyebut preview siap atau menggunakan report lama sebagai sertifikasi.
3. **Belum multi-tenant.** Create tenant di platform belum dapat membuat dealer automotive terisolasi pada source sekarang.
4. **Upload request limit perlu QA.** Validator mengizinkan JPEG/PNG/WEBP dengan signature check, maksimum mobil 8 MB dan logo 4 MB. `next.config.ts` belum mengatur Server Action body size; transport dapat menolak file sebelum validator. Ini risiko statis, bukan hasil reproduksi kegagalan upload.
5. **Konten tetap dan klaim benefit.** Copy Homepage belum bisa disesuaikan dealer; konten baru harus faktual dan opsional bila kosong.
6. **Public master-data options.** Homepage dapat menampilkan merek/model tanpa stok AVAILABLE; seragamkan dengan katalog jika bagian search disentuh.
7. **Maps/social propagation belum lengkap.** Data tersimpan tidak otomatis berarti tampil public.
8. **Seed bukan reset aman umum.** Staging seed melakukan upsert termasuk mengganti password admin/settings dan data mobil dengan slug preview; jangan dijalankan pada DB bersama atau untuk mempertahankan edit manual tanpa review.
9. **Proxy trust/runtime.** Limiter in-memory memerlukan satu instance dan localhost-only service dengan Nginx menimpa IP headers. Cloudflare real-IP chain belum terverifikasi.
10. **Media persistence.** Local files di deployment directory perlu tetap tersedia saat update/rollback; contoh service saja tidak membuktikan persistence.
11. **Security baseline bukan certification.** CSP masih mengizinkan inline script/style serta image HTTPS; upload/auth/proxy browser QA tetap diperlukan. Tidak ada secret dicetak dalam audit ini.
12. **Report lama mempunyai snapshot usang.** Contohnya status uncommitted sudah berubah; jangan mengubah source berdasarkan asumsi report lama.

## 11. Exact recommended scope untuk Stage 2

Stage 2 berfokus pada **kelengkapan konten single-dealer dan banner responsive**, lalu menyiapkan pengujian. Scope yang direkomendasikan:

1. Tambahkan migration additive untuk profile/content, main/promo banner, advantages, FAQ dan leasing logos; pertahankan inventori/auth yang ada.
2. Tambahkan editor admin untuk welcome, about/showroom, jam operasional, advantage, FAQ, leasing partner, serta banner main/promo. Semua mutasi independen mengotorisasi admin dan memvalidasi input server-side.
3. Implementasikan main banner sesuai seluruh kontrak pada matrix: satu upload per slide untuk semua device; maksimal 5 aktif; optional safe link; ordering; rasio 2:1 di bawah 1280px dan 21:9 mulai 1280px; landscape cover; portrait contain + blurred backdrop; autoplay 5s, swipe/arrows/dots/keyboard; hide controls untuk satu slide; tanpa overlay text/button. Pertimbangkan reduced motion dan pause interaksi untuk aksesibilitas.
4. Susun Homepage menjadi main banner, welcome, search, promo, available cars, about summary, advantages, leasing logos, FAQ, contact/footer. Pertahankan tautan NEW/USED serta aturan featured/latest yang berguna; hindari redesign besar atau menghilangkan perilaku inventori tanpa alasan.
5. Buat `/about` yang menggunakan profile yang sama dengan ringkasan Homepage; lengkapi header/footer navigation, Maps/social safe links dan jam operasional. Konten opsional kosong/inactive tidak tampil public.
6. Reuse StorageProvider dan validasi MIME/signature; tambahkan namespace/key serta batas banner/showroom/logo partner yang eksplisit. Reuse compensation untuk replace/delete; jangan commit media upload. Verifikasi transport body limit bersama batas validator.
7. Pertahankan pencarian/catalog/AVAILABLE-only. Jika opsi Homepage direvisi, filter merek/model terhadap kendaraan AVAILABLE. Jangan menambah fitur pencarian besar; homepage price range dapat ditunda kecuali dipastikan bagian kontrak Stage 2.
8. Tambahkan metadata/canonical `/about`, sitemap rule yang sesuai, safe text rendering, revalidation konten setelah save dan staging noindex yang tetap terisolasi dari production.
9. Tambahkan test yang bermakna untuk active limit/concurrency, ordering/visibility, safe links/uploads, profile fallback, metadata dan public inventory regression. Jalankan lint/typecheck/test/build dan Prisma validation setelah implementasi.
10. Lakukan staging browser QA bila akses tersedia: banner landscape/portrait di 390/768/1280px, 0/1/5 slide, keyboard/swipe, admin content propagation, upload failure handling, DRAFT/SOLD exclusion dan staging noindex. Laporkan BLOCKED jika runtime tidak tersedia.

Tidak termasuk Stage 2: tenant provisioning/Dynicty Core integration, customer accounts, financing flow, CRM, test drive, comparison, marketplace, multi-showroom, production cutover atau perubahan DNS/VPS. R2 completion dan sertifikasi deployment harus dilacak sebagai work terpisah sebelum mengaktifkan storage R2.

## 12. Hasil dan stop condition

Repository sesuai, source foundation tersedia, worktree awal bersih dan tersinkron, serta gap konten/banner/schema telah teridentifikasi. Tidak ada foundation yang mengharuskan menghentikan perencanaan Stage 2. Runtime staging, DB dan browser tetap belum terverifikasi; keputusan ini bukan status production/staging ready.

Final status: **READY FOR STAGE 2**

Audit berhenti setelah report ini. Tidak ada implementasi Stage 2, commit/push, deployment, perubahan production hostname, atau mutasi data/infrastruktur.
