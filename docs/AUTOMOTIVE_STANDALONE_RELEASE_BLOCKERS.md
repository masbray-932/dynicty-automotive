# Dynicty Automotive — Standalone release blockers

Updated 9 November 2026 (WIB). Verified S5.1 baseline: `740b36ce562009949572b10dc52a19b84c232e81`. S5 historical evidence remains in the QA matrix; current disposition is below.

| ID | Original issue | Root cause | Changes / actual evidence | Remaining limitations | Current status |
|---|---|---|---|---|---|
| RB-01 | Customer host/service not validated | No customer VPS/systemd runtime available | No live infrastructure changes; local application start/restart works | UID/GID, firewall, filesystem ACL, systemd failure recovery, journal/rotation on customer host | BLOCKED |
| RB-02 | DNS/public TLS not verified | No customer hostname/certificate access | Self-signed disposable Nginx HTTPS tested; unknown Host 421 | Public DNS, certificate chain, strict SNI and hostname routing require actual customer host | BLOCKED |
| RB-03 | Incomplete browser acceptance | S5 desktop journey did not cover requested mobile/tablet/CMS media combinations | S5.1 Chromium/PG/HTTPS: 12 checkpoints PASS across 390/768/1280; car validation/create/edit/images, brand/model, profile/branding/logo, CMS banners/promo/about/showroom/FAQ/leasing, dialogs/focus/logout | Full feature×viewport cross-product, cross-browser and customer UAT not executed. CMS remount may hide success text; persistence/public output verified separately | LOCAL EXPANDED PASS; CUSTOMER ACCEPTANCE BLOCKED |
| RB-04 | Excluded detail streamed HTTP 200 | Public layout streaming precedes page-level notFound; static 404 rewrite also introduced cache risk; default Proxy hides RSC headers | Gate with shared legacy AVAILABLE predicate; request-time 404 target; explicit RSC/HEAD negative response; Next-supported raw proxy request option. Final 18 HTML/RSC/HEAD status checks PASS; no-store/noindex; transition 200→404→200; revoked client link ends on branded 404 | Gate and page read are separate snapshots; page rechecks ownership. Exact concurrent publication race and generic DB outage HTTP 200 remain documented limitations | RESOLVED — LOCAL APPLICATION |
| RB-05 | Customer ingress/media chain not verified | Prior evidence tested app/Nginx separately | S5.1 app uploads through disposable Nginx HTTPS; real media bytes and SHA-256, WebP logo, deletion/replacement, two-root namespace isolation, traversal and 413; 10 checks before/after restart PASS | Self-signed loopback/IP browser allowance is QA-only; customer proxy/IP trust, public TLS, strict SNI and OS permissions remain unverified | LOCAL CHAIN PASS; CUSTOMER HOST BLOCKED |
| RB-06 | Customer backup/restore drill missing | No authorized customer recovery environment | Prior S4/S5 disposable encrypted backup/restore evidence preserved; no new customer restore claimed | Customer RTO/RPO, scheduling, encryption-key custody and offsite recovery | BLOCKED |
| RB-07 | Customer historical data compatibility | Synthetic fixtures cannot prove real historical inventory/media compatibility | S5.1 legacy/registered/mixed fixture tests and six migrations on fresh disposable PG | Read-only customer snapshot, historical keys and primary-admin inventory still required | BLOCKED |

| Release gate | Verdict |
|---|---|
| Application S5.1 | **PASS WITH LIMITATIONS** |
| Customer infrastructure | **BLOCKED** |
| Commercial release | **BLOCKED** |

A successful build and local remediation do not certify a customer installation. No deployment, DNS/certificate operation, live DB access, or merge was performed. Full evidence and commands: `docs/AUTOMOTIVE_STANDALONE_S5_1_IMPLEMENTATION_REPORT.md`.
