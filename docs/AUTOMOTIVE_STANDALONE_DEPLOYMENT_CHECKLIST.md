# Standalone customer deployment checklist

Template only. Record installation ID, commit, operator, date, outcome and evidence next to each check; do not attach credentials or session values.

- [ ] Reserve a unique ID, HTTPS hostname, loopback port, Unix user/group, database/runtime login, migrator login, media directory and secret/backup paths. Confirm no collisions or shared customer credentials.
- [ ] Render the package with [the installation contract](./AUTOMOTIVE_STANDALONE_INSTALLATION.md). Inspect outputs, confirm separate UID/group and unprivileged runtime, configure physical media root and Nginx worker read-only access, and secure the runtime env (`0600`, outside Git). Verify the upstream cannot be accessed from another host.
- [ ] Prepare a locked build for the exact public origin. Verify production preflight with the service's actual environment and runtime identity; check process health and DB readiness separately.
- [ ] Apply the checked-in migrations as the migrator; check status and grant only runtime access. Test cross-database denial and no schema creation by the runtime role. Bootstrap the primary admin, confirm one account, and remove seed credentials.
- [ ] Install a single default reject vhost and the customer vhost. Test `nginx -t` and service config; verify existing TLS certificate, chain, exact host/SNI, redirect, headers and the 12 MiB ingress cap. Do not bypass TLS checks in acceptance.
- [ ] Test anonymous, authenticated and wrong-origin Admin actions. Test logo and car image upload/replacement/delete, CMS, branding, storefront and canonical URLs on desktop/mobile. Confirm new files serve without restart and persist after a release switch.
- [ ] Run the [backup and restore drill](./AUTOMOTIVE_STANDALONE_BACKUP_RESTORE.md) and document RPO/RTO, retention, who can decrypt, and proof of data/media recovery.
- [ ] Review [upgrade and rollback](./AUTOMOTIVE_STANDALONE_UPGRADE_ROLLBACK.md), monitoring, failed-deployment ownership and alert routing. Explicitly record any unverified item before customer handoff.

Use disposable/operator-approved test values. Set `HOST` to the customer hostname and `EDGE_IP` to the test listener. The following assume a trusted certificate for `$HOST`; supply `--cacert` with the approved test CA when needed.

```sh
curl -fsS --resolve "$HOST:443:$EDGE_IP" "https://$HOST/healthz"
curl -sS -I --resolve "$HOST:80:$EDGE_IP" "http://$HOST/cars"
curl -sS -o /dev/null -w '%{http_code}\n' --resolve "$HOST:443:$EDGE_IP" \
  -H 'Host: wrong.example' "https://$HOST/healthz"   # 421, not app content
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Host: wrong.example' "http://$EDGE_IP/"   # 421
curl -sS --resolve "wrong.example:443:$EDGE_IP" https://wrong.example/   # TLS handshake rejected
curl -fsS --resolve "$HOST:443:$EDGE_IP" -H 'X-Forwarded-Host: wrong.example' "https://$HOST/"
```

The last response must use only the configured canonical host. With two vhosts, test mismatched TLS SNI A and Host B and verify rejection. Use an authenticated action with a wrong Origin and verify no mutation; do not copy cookies into a shared command log. For media, check correct MIME and `nosniff`, reject symlinks and non-image extensions, and verify the other host cannot retrieve a file unique to the first root. The same valid path can exist independently in two installations.
