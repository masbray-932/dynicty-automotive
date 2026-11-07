# Dynicty Automotive — Standalone release blockers

Baseline yang dinilai: `fbfbece82cd468e91d0bbe7946aba1e72ac2215c`.

| ID | Blocker | Bukti sekarang | Dampak | Syarat penutupan | Status |
|---|---|---|---|---|---|
| RB-01 | Belum ada validasi host pelanggan | Tidak tersedia VPS/domain customer; PID 1 lingkungan QA bukan systemd | Service, permission, firewall dan recovery belum tersertifikasi | Deploy kandidat terisolasi; uji start/restart/failure, UID/GID dan journal | BLOCKED |
| RB-02 | DNS dan public TLS belum diverifikasi | Hanya self-signed loopback Nginx yang diuji | Hostname, SNI, chain dan redirect publik belum terbukti | Verifikasi DNS, certificate chain, HTTPS, unknown-host rejection dan scan eksternal | BLOCKED |
| RB-03 | Acceptance browser pada ingress kandidat belum lengkap | Desktop Chromium + disposable DB: 18 checkpoint branding/profile/logo/CMS profile/FAQ/taxonomy/vehicle/images/validation/logout PASS. Responsive smoke sebelumnya PASS | Seluruh kombinasi CMS/media dan interaksi mobile/tablet belum tercakup; decode bytes via ingress belum terbukti | Ulangi melalui kandidat, tambah banner/promo/leasing, format/size invalid, gallery bytes, dan interaksi mobile/tablet | OPEN — LOCAL PARTIAL PASS |
| RB-04 | Detail excluded memakai HTTP 200 streaming | DRAFT, SOLD dan unknown tampil not-found/noindex tanpa data, tetapi response transport 200 | Monitor/integrasi yang mensyaratkan 404 dan interpretasi crawler tertentu dapat salah | Putuskan acceptance; bila 404 wajib, implementasikan availability gate sebelum stream dan uji ownership/cache/error path | OPEN HIGH |
| RB-05 | End-to-end ingress customer belum diuji | Nginx dan aplikasi masing-masing lulus di disposable setup | Forwarded IP/origin, Server Action, upload limit, cookie dan media alias pada host final belum terbukti | Uji seluruh chain melalui hostname kandidat | BLOCKED |
| RB-06 | Backup/restore customer belum didrill | Encrypted disposable restore dan digest PASS | RTO/RPO, kapasitas dan akses operator customer belum diketahui | Backup penuh pre-launch, restore ke DB/temp media terpisah, catat durasi dan checksum | BLOCKED |
| RB-07 | Real customer data compatibility belum diaudit | Fixture legacy/owned/mixed PASS; tidak ada live data yang disentuh | Kunci media lama, admin ganda atau record historis bisa berbeda | Read-only preflight terhadap snapshot customer, bukan DB live | BLOCKED |

## Release decision

| Area | Verdict |
|---|---|
| Source/application candidate | **PASS WITH LIMITATIONS** |
| Customer installation | **BLOCKED** |
| Commercial launch | **BLOCKED** |

Tidak ada dasar untuk menyebut produk “production ready” sebelum RB-01, RB-02, RB-03, RB-05 dan RB-06 ditutup pada instalasi kandidat. RB-04 harus diperbaiki atau diterima secara tertulis dengan konsekuensi transport-status yang jelas.
