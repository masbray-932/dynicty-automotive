# Final QA Matrix

Date: 2026-09-15. `PASS` requires an executed automated or runtime check stated in Evidence. `BLOCKED` means the required PostgreSQL/R2/deployed-app/browser context was unavailable. No item failed in the available repository checks; unverified production flows are not promoted to PASS.

## Admin

| Check | Status | Evidence |
| --- | --- | --- |
| Login | BLOCKED | Login form/noindex rendered locally; valid credential flow requires DB/admin. |
| Logout | BLOCKED | Source/test review only; live session unavailable. |
| Limiter | BLOCKED | Pure threshold/cooldown/trusted-header tests PASS; production Nginx/real-IP behavior unavailable. |
| Dashboard | BLOCKED | Build/typecheck PASS; real counts need DB and authenticated browser. |
| Brands | BLOCKED | Server validation/auth reviewed; no DB browser workflow. |
| Models | BLOCKED | Server validation/brand relation reviewed; no DB browser workflow. |
| Create car | BLOCKED | Automated domain/validation tests PASS; no production DB. |
| Edit car | BLOCKED | Automated domain/validation tests PASS; no production DB. |
| Delete car | BLOCKED | Transaction/cleanup source review only. |
| Image upload | BLOCKED | MIME/signature/size tests PASS; R2 operations unavailable. |
| Image reorder | BLOCKED | Domain tests PASS; no DB/R2 runtime. |
| Cover image | BLOCKED | Domain/constraint tests PASS; no DB/R2 runtime. |
| Settings | BLOCKED | Validation/service tests PASS; no authenticated DB runtime. |
| Logo | BLOCKED | Validation/compensation review PASS; no R2 runtime. |

## Public

| Check | Status | Evidence |
| --- | --- | --- |
| Homepage | BLOCKED | Local DB-failure fallback rendered; production hostname serves another Dynicty page. |
| Search | BLOCKED | Query tests PASS; browser + real inventory unavailable. |
| NEW | BLOCKED | AVAILABLE predicate tests PASS; real inventory unavailable. |
| USED | BLOCKED | Mileage/visibility tests PASS; real inventory unavailable. |
| Catalog | BLOCKED | Local fallback rendered; no production DB. |
| Filters | BLOCKED | Parser/query tests PASS; no browser inventory. |
| Sorting | BLOCKED | Deterministic order tests PASS; no database result set. |
| Pagination | BLOCKED | Bound/math tests PASS; no real result set. |
| Detail | BLOCKED | AVAILABLE-only service/build reviewed; no DB detail record. |
| Gallery | BLOCKED | Component/build PASS; no media/browser workflow. |
| WhatsApp | BLOCKED | URL/encoding tests PASS; no configured production dealer/car. |
| Related cars | BLOCKED | Bounded query review only; no DB. |
| 404 | BLOCKED | Branded not-found builds; DB-unavailable detail cannot prove hidden-record 404. |

## SEO

| Check | Status | Evidence |
| --- | --- | --- |
| Metadata | BLOCKED | Local runtime title/description verified; deployed hostname is not this app. |
| Canonical | BLOCKED | Local output uses `https://automotive.dynicty.com`; production app not deployed. |
| Open Graph | BLOCKED | Local Homepage OG URL verified; target production output unavailable. |
| JSON-LD | BLOCKED | Pure factual/escaping tests PASS; no real AVAILABLE production detail. |
| Sitemap | BLOCKED | Local degraded sitemap has correct origin/base URLs; AVAILABLE production rows unavailable. |
| Robots | BLOCKED | Local runtime has correct host/admin disallow/no localhost; production app not deployed. |

## Infrastructure

| Check | Status | Evidence |
| --- | --- | --- |
| DB | BLOCKED | No DATABASE_URL/client/production database access. |
| R2 | BLOCKED | No credentials/bucket; adapter put/delete remain intentionally incomplete. |
| Build | PASS | Frozen install, generate, lint, typecheck, 56 tests, and production build executed successfully. |
| Service | BLOCKED | Local `next start` smoke passed; no VPS/systemd access. |
| Nginx | BLOCKED | Production-ready example prepared; binary/VPS unavailable. |
| DNS | BLOCKED | Host resolves to Dynicty `Toko belum tersedia`; no DNS control/cutover. |
| SSL | BLOCKED | Current host HTTPS loads, but target VPS certificate/origin is unavailable. |
| Headers | BLOCKED | Local production-mode headers PASS; deployed application response unavailable. |
| Backup | BLOCKED | Strategy/dump validation commands prepared; no DB/destination to execute. |
| Rollback | PASS | Application/DB/DNS/media plan documented and reviewed; live drill remains blocked. |

## Summary

- PASS: 2 infrastructure/preparation checks.
- FAIL: 0.
- BLOCKED: 41 end-to-end/production checks.
- Automated repository suite: 10 files, 56 tests, all PASS.
- Certification impact: production-ready status is prohibited until all critical DB, R2, service, proxy, hostname, header, browser, and backup blockers are resolved.
