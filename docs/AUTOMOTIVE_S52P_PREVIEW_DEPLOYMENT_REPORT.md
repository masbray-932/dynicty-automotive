# DYNICTY AUTOMOTIVE — S5.2P PREVIEW DEPLOYMENT REPORT

## Final verdict

**BLOCKED — deployment access unavailable.**

The safety gate stopped this run before any server, database, service, configuration, tenant, or media mutation. The expected release remains undeployed by this execution.

## 1. Verified release and GitHub state

- Repository: `masbray-932/dynicty-automotive`
- Local checkout: `C:\Projects\dynicty-automotive`
- Branch: `feat/automotive-standalone-s5-2d-public-redesign`
- Local HEAD before this report: `aaf29ba9ff3ca6a969a414054da9bd44c43e000c`
- Remote branch HEAD before this report: `aaf29ba9ff3ca6a969a414054da9bd44c43e000c`
- Working tree before this report: clean
- PR #20: open, unmerged, mergeable, base `main`, expected feature head
- GitHub Actions run #11 for `aaf29ba9ff3ca6a969a414054da9bd44c43e000c`: completed successfully

## 2. Public preview endpoint evidence

- URL: `https://automotive-preview.dynicty.com/`
- DNS A record resolved to the existing public preview host.
- HTTPS homepage returned HTTP 200.
- Server header identified Nginx on Ubuntu.
- `/healthz` returned exactly `{"status":"ok"}`.
- Responses included staging protections such as `X-Robots-Tag: noindex, nofollow, noarchive` and private/no-store cache policy.

This verifies the public endpoint, but not the server-side application directory, deployed Git commit, systemd unit, database identity, environment file, storage root, or rollback release.

## 3. Runbook and intended isolation contract

The committed staging runbook documents the following intended preview resources:

- application path: `/var/www/dynicty-automotive-preview`
- service: `dynicty-automotive-preview.service`
- listener: `127.0.0.1:3101`
- database: `dynicty_automotive_staging`
- environment file: `/etc/dynicty-automotive-preview.env`
- persistent media: isolated preview storage

These values were treated only as a runbook contract. They were not assumed to be the active runtime values because authenticated VPS inspection could not be completed.

The documented rollback procedure is application checkout/build/restart to the prior reviewed commit while leaving additive migrations installed. A database restore requires a verified pre-deployment dump and an isolated restore/switch procedure. Runtime rollback readiness could not be confirmed.

## 4. Access verification and blocker

- The preview DNS host key was already present in the local SSH `known_hosts` file.
- The only locally discoverable SSH target for that host was the root account on the resolved preview IP.
- There was no SSH config alias, private key file, deploy environment variable, or running SSH agent available to this session.
- A read-only non-interactive authentication probe used strict host-key checking and `BatchMode=yes`.
- Result: `Permission denied (publickey,password)`.

No password was requested or transmitted through chat. No authentication dialog was automated. Without an authenticated session, the VPS environment cannot be positively identified as required by the deployment gate.

## 5. Backup and migration status

- Preview database identity: **NOT VERIFIED**.
- Database connectivity: **NOT VERIFIED**.
- Timestamped database backup: **NOT CREATED**.
- Backup readability: **NOT VERIFIED**.
- Existing migration history: **NOT VERIFIED**.
- `20261114000000_s52n_inventory_mode`: present in the reviewed repository, not verified on preview.
- `20261116000000_s52p_welcome_typography`: present in the reviewed repository, not applied by this run.
- Prisma migration deploy: **NOT RUN**.

The task required stopping before deployment if backup creation or validation could not be completed. No reset, `db push`, manual table alteration, or database write was attempted.

## 6. Deployment status

- Previous deployed commit: **UNKNOWN**.
- Requested deployed commit: `aaf29ba9ff3ca6a969a414054da9bd44c43e000c`.
- Git fetch/checkout/install/build on VPS: **NOT RUN**.
- Preview service restart: **NOT RUN**.
- Nginx/DNS/TLS changes: **NONE**.
- Production services and database: **UNTOUCHED**.
- Persistent uploads and tenant data: **UNTOUCHED**.

Because the active application path, service, database and storage could not be inspected, no deployment command was issued and no rollback was necessary.

## 7. Autoeighteen configuration

- Autoeighteen tenant identity: **NOT VERIFIED**.
- `inventoryMode` before/after: **NOT TESTED / UNCHANGED**.
- Another `BOTH` tenant comparison: **NOT TESTED**.

No tenant identifier was guessed and no dealer setting was changed.

## 8. Runtime and browser QA

The public endpoint and health route were reachable before deployment, but the requested release was not deployed. Therefore the following S5.2P checks are **NOT TESTED** against the preview environment:

- responsive hero at 320, 375, 390, 430, 768, 1024, 1280 and 1440 px;
- tablet portrait/landscape artwork visibility;
- floating WhatsApp label, destination and safe-area behavior on the deployed release;
- Admin Sambutan controls, persistence and public reflection;
- leasing-logo 600 × 240 guidance and horizontal preview;
- previous search, inventory, catalog, detail, navigation and sales CTA fixes on the deployed release.

No responsive screenshot evidence is claimed. No Admin values were changed.

## 9. Required recovery action

An authorized operator must establish non-interactive, host-key-verified SSH access for this machine, preferably by loading the approved preview deployment key into an SSH agent or installing a least-privilege deploy key/account. Do not paste the VPS password into chat.

After access is available, restart from Phase 0 and verify the actual runtime values before mutation. Then:

1. create and validate a timestamped custom-format backup of the verified preview database;
2. record the current deployed commit, environment names, service, port and persistent media path;
3. apply committed migrations with `pnpm db:migrate:deploy` against the verified preview database;
4. deploy exactly `aaf29ba9ff3ca6a969a414054da9bd44c43e000c` using the established release procedure;
5. restart only the verified preview service and confirm loopback/public health;
6. identify Autoeighteen through authorized evidence before changing `inventoryMode`;
7. complete the requested browser matrix and Admin persistence checks;
8. preserve the prior application release and backup for rollback.

## 10. Safety summary

- No production access or modification.
- No preview database write.
- No migration execution.
- No service restart.
- No source-code change.
- No PR merge or deployment.
- No tenant or media modification.
- Only this non-secret verification report was added to the repository.
