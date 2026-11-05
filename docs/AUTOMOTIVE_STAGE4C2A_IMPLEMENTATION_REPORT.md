# Dynicty Automotive — Stage 4C.2A: Design System v2 Token Foundation

**Verdict: PASS WITH LIMITATIONS.** Fondasi token, uji regresi, dan build lulus. Browser tidak diverifikasi. Stage 4C.2B tidak dimulai.

| Baseline | Bukti |
|---|---|
| Repo dan remote | `masbray-932/dynicty-automotive`, remote `origin`. |
| GitHub main | `808c1da098702a99728796074150728e94f43481`, diverifikasi lewat `git ls-remote origin refs/heads/main` sebelum perubahan. Tree identik dengan commit Stage 4B.2 `b15959e`. |
| Workspace | Main lokal lama (`69325e6`) berisi 41 tracked modifications dan 34 entri untracked. Implementasi dibuat di worktree detached bersih pada baseline GitHub; checkout utama dan index aslinya tidak diubah. |
| Referensi dibaca | `docs/AUTOMOTIVE_STAGE4C1_DESIGN_TOKEN_AUDIT.md` dari workspace utama; lampiran `ECOMMERCE_DESIGN_TOKENS_AUDIT.md` dari `upload/`; resolver, root/public layout, CSS, pemakai utility serta tes tema/konfirmasi pada baseline. E-commerce dipakai sebagai kontrak nama dan makna; palet dan provider tidak disalin. |
| Default sebelum perubahan | Primary `#DC2626`, secondary/surface `#18181B`, background `#09090B`, foreground `#F4F4F5`, muted `#A1A1AA`, border `#3F3F46`, action foreground putih dan focus merah. Shared UI memakai utility `brand-primary`, `brand-on-primary`, `brand-focus`; bridge background/surface lama berbenturan dengan nama kanonik. |

| Token kontrak v2 | Default Automotive | Pemetaan dan penggunaan |
|---|---|---|
| `--color-primary` | `#DC2626` | Aksi utama dan seleksi. Warna primary lama yang valid tetap dipakai storefront. |
| `--color-primary-dark` | `#B91C1C` | Slot hover/pressed eksplisit; komponen saat ini mempertahankan hover lama. Default independen dari primary. |
| `--color-accent` | `#DC2626` | Slot aksen independen; tidak berasal dari secondary lama dan belum dipakai untuk restyle komponen. |
| `--color-background` | `#09090B` | Background shell. |
| `--color-surface` | `#18181B` | Slot permukaan panel. |
| `--color-surface-secondary` | `#09090B` | Slot permukaan alternatif/kontrol dengan warna gelap yang sudah dipakai. |
| `--color-text-primary` | `#F4F4F5` | Warna teks shell bila kontras terhadap background mencukupi. |
| `--color-text-secondary` | `#A1A1AA` | Slot muted text. |
| `--color-border` | `#3F3F46` | Slot border; tidak dinyatakan cukup untuk seluruh batas kontrol. |
| `--color-sale` | `#DC2626` | Reserved untuk kompatibilitas kontrak; bukan status atau harga kendaraan. |

`AUTOMOTIVE_TOKEN_DEFAULTS` adalah sumber default tunggal. `resolveAutomotiveTheme()` menerima record dengan key kanonik saja. Nilai override harus hex enam digit dan dinormalisasi uppercase. Key hilang/null kembali ke default; field dengan tipe lain, sintaks CSS, key asing, dan accessor ditolak. Resolver mengembalikan salinan lengkap tanpa mengubah input. Adapter legacy hanya melewatkan warna utama valid, dengan fallback default untuk nilai lama yang kosong/rusak.

| Alias yang dipakai | Resolusi |
|---|---|
| `--auto-background` | Background kanonik. Body fallback dan shell mengecat latarnya masing-masing. |
| `--auto-foreground` | Teks utama jika rasio terhadap background ≥4,5:1; jika tidak, pilih hitam atau putih yang lebih kontras. |
| `--auto-action-primary` | Primary; bridge `bg-brand-primary` dan warna seleksi. |
| `--auto-action-foreground` | Hitam atau putih yang lebih kontras terhadap primary; bridge `text-brand-on-primary` dan teks seleksi. |
| `--auto-focus` | Primary bila kontras terhadap background ≥3:1; jika tidak, gunakan foreground shell. Utility focus lama dipertahankan. |

`.automotive-storefront` mengirim sepuluh token dan alias melalui SSR. Body mengirim alias fixed dari default saja untuk Admin dan fallback. Tailwind v4 hanya mendefinisikan bridge yang masih dikonsumsi; canonical background/surface tidak lagi dipakai sebagai nama bridge. Tidak ada provider client, alias commerce, atau penulisan token tenant ke `:root`. Komponen, tipografi, ukuran, media, warna status, konfirmasi, dan aturan SEO tetap pada baseline.

| File | Perubahan |
|---|---|
| `features/theme/domain.ts` | Kontrak v2, validasi ketat, derivasi kontras dan output storefront/system. |
| `features/theme/theme-scope.tsx` | Boundary storefront dan atribut versi SSR. |
| `app/(public)/layout.tsx` | Adapter warna utama legacy menuju override kanonik. |
| `app/layout.tsx` | Alias default fixed pada body. |
| `app/globals.css` | Paint dan selection storefront; bridge Tailwind tanpa benturan. |
| `tests/theme-foundation.test.tsx` | Default, override/null/error, kontras light/dark, input immutable, SSR, Admin, dan CSS scope; tes aksesibilitas yang sudah ada dipertahankan. |
| `docs/AUTOMOTIVE_STAGE4C2A_IMPLEMENTATION_REPORT.md` | Laporan terpisah dari patch implementasi agar checksum patch dapat dicatat di sini. |

| Validasi | Hasil |
|---|---|
| Vitest `run --no-cache --configLoader runner` | **251 lulus / 26 file**; mencakup suite Stage 4B.2 dan SSR integrasi dengan service dealer yang dimock. |
| ESLint `eslint .` | **PASS**. |
| Next `typegen` dan TypeScript `tsc --noEmit --incremental false` | **PASS**. |
| Next 16.3.5 `build --webpack` | **PASS**. Konfigurasi staging sintetis lokal, URL DB nonresolving dan tanpa koneksi DB. |
| Pemeriksaan CSS hasil build | **PASS**. Tidak ada deklarasi global untuk sepuluh token kanonik; tiga bridge mengarah ke alias yang benar dan scoped selection ada. |
| Patch | **PASS**: whitespace, apply check pada worktree bersih dengan tree identik, reverse check pada implementasi, serta apply ke index sementara dari baseline SHA persis dan pembandingan enam file hasilnya. |
| Browser dan runtime dengan data live | **NOT VERIFIED**. Tidak ada browser executable yang ditemukan. Pemeriksaan kontras bukan sertifikasi semua komponen/hover/surface. |

| Risiko tersisa | Batas tahap |
|---|---|
| Dealer Admin masih dapat menulis warna lama | Izin, DTO penyimpanan, dan form warna tetap. `secondaryColor` masih tersimpan namun tidak dipetakan ke token v2. |
| Palet baru menyeluruh | Kontrak dapat diuji dengan palet light/dark; komponen literal tidak dimigrasikan sehingga tema terang penuh belum didukung. Focus dinilai terhadap background shell, bukan semua surface atau overlay. Hover dan status yang sudah ada belum diubah. |
| Data dan deployment | Tidak ada akses DB, migrasi, perubahan auth/izin, commit, push, atau deploy. Isolasi tenant dan rollout multi-dealer belum dikerjakan. |

Patch: `dynicty-automotive-stage4c2a.patch` · 22.671 byte · SHA-256 `9451149d03c075cc7d14cd41455aca550d5e41ad37a49970a580499660897734`.
