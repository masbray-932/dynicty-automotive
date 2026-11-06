# Standalone backup and restore runbook

Back up one customer at a time. Record a per-customer recovery point including release SHA, PostgreSQL version, customer hostname, service ID, media root and backup timestamp. Keep backups off-host, encrypted and accessible only to the assigned recovery operators. Use a unique age recovery recipient/key or an equivalent independently managed encryption policy per customer. Keep the decryption key outside the backup host/archive and test recovery access. Set customer-approved RPO/RTO and retention (for example 14 daily and 8 weekly recovery points); record expiration and verify deletions at the destination rather than deleting the only good backup. Never log DB credentials or secret file contents.

## Create a coordinated recovery point

Quiesce writes: stop this customer's app service and stop any worker or operator writes to its database and media. Direct public reads can continue. Obtain the release SHA from the deployed artifact record. Prepare a root/private scratch directory and an off-host transfer destination; run as an authorized backup operator with read access to runtime config and media. Configure a trusted PostgreSQL service named by `PGSERVICE` and private `PGPASSFILE` with the intended backup/migrator credentials; verify `SELECT current_database(), current_user` and role/target before proceeding. This procedure needs compatible `pg_dump`, GNU tar, SHA-256 utilities and age.

Set `MEDIA` to the physical upload directory, `RUNTIME_ENV` to the protected environment file, `CONFIG_EXPORT` to an operator-prepared folder with the rendered unit/vhost, release metadata and recovery notes (no decryption key), `WORK_PARENT` to private local scratch, `BACKUP_DIR` to private local output, `BACKUP_NAME` to a unique customer/timestamp identifier without slashes, and `AGE_RECIPIENT` to the recovery public key. Validate all paths and inventory the media tree for symlinks or special files; resolve those before backup. Certificate material is recovered separately through the operator's restricted certificate process, or explicitly encrypted under a separate approved policy. Record which approach applies.

```sh
set -eu
umask 077
work=$(mktemp -d "$WORK_PARENT/automotive-backup.XXXXXXXX")
trap 'rm -rf -- "$work"' EXIT
pg_dump --format=custom --no-owner --no-acl --file="$work/database.dump"
pg_restore --list "$work/database.dump" >/dev/null
tar -C "$MEDIA" -cpf "$work/media.tar" .
install -m 0600 "$RUNTIME_ENV" "$work/runtime.env"
tar -C "$CONFIG_EXPORT" -cpf "$work/config.tar" .
(cd "$work" && sha256sum database.dump media.tar runtime.env config.tar > SHA256SUMS)
encrypted=$(mktemp "$BACKUP_DIR/.automotive.XXXXXXXX")
trap 'rm -f -- "$encrypted"; rm -rf -- "$work"' EXIT
tar -C "$work" -cf "$work/bundle.tar" database.dump media.tar runtime.env config.tar SHA256SUMS
age -r "$AGE_RECIPIENT" -o "$encrypted" "$work/bundle.tar"
ln -- "$encrypted" "$BACKUP_DIR/$BACKUP_NAME.tar.age"  # fails if a backup with this name exists
sha256sum "$BACKUP_DIR/$BACKUP_NAME.tar.age"
```

Transfer the encrypted artifact and checksum to the independent backup destination, check the checksum there, then restart the app and verify health and a known database-backed request. If backup fails, verify the failure and restore service deliberately; do not treat a partial archive as a recovery point. Temporary plaintext may remain after unclean termination; use encrypted scratch storage and review it after interruption. Do not leave plaintext dumps or runtime env in Git or shared storage.

## Restore drill

Restore to a newly provisioned, empty, isolated PostgreSQL database and a new empty physical media directory. Do **not** use `--clean`, `--create`, or Prisma reset on a customer database. Pause the drill if the role, database or media destination matches a live target. Preserve encrypted source backup and original data. Decrypt only a trusted backup in a private scratch directory. Inspect archive listings for unexpected paths, symlinks, hardlinks or special files before extracting any archive; extract as an unprivileged recovery identity, never as root.

```sh
# After selecting a private restore working directory and a vetted backup:
set -eu
umask 077
: "${RESTORE_DB:?Set the new isolated database name}" "${RESTORE_MEDIA:?Set the empty physical media directory}"
test -d "$RESTORE_MEDIA"
test -z "$(find "$RESTORE_MEDIA" -mindepth 1 -print -quit)"
age -d -i "$AGE_IDENTITY" -o bundle.tar "$BACKUP_FILE"
tar -tf bundle.tar
tar --no-same-owner --no-same-permissions -xf bundle.tar
sha256sum -c SHA256SUMS
pg_restore --list database.dump
tar -tvf media.tar
tar -tvf config.tar
# Independently confirm the active PGSERVICE/PGPASSFILE targets only the empty restore DB.
psql -X -v ON_ERROR_STOP=1 -c 'SELECT current_database(), current_user'
test "$(psql -XAt -v ON_ERROR_STOP=1 -c 'SELECT current_database()')" = "$RESTORE_DB"
# In addition to confirming the expected target and owner, reject an occupied public schema.
test "$(psql -XAt -v ON_ERROR_STOP=1 -c "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'")" = 0
pg_restore --exit-on-error --single-transaction --no-owner --no-acl -d "service=$PGSERVICE" database.dump
tar --no-same-owner --no-same-permissions -C "$RESTORE_MEDIA" -xf media.tar
```

Restore under the new database owner role. Reapply the runtime role grants and metadata revoke from the installation contract (the dump excludes ownership/ACLs). Compare counts and selected data, verify dump/media checksums and file counts, reapply correct media ownership and read-only worker ACLs, and run Prisma migration status with the restored release. Use fresh test runtime credentials, session secret and isolated hostname in a drill; do not attach the restored copy to the public customer hostname. When recovering a real customer, decide whether to preserve or rotate session secret and database credentials; rotating the session secret invalidates existing browser sessions. Verify a known record, image bytes through the proxy, Admin login and mutations on the isolated copy. Record elapsed time, known data loss, failures and the operator's approval before any traffic switch. Do not promote or overwrite an existing database as part of a drill.
