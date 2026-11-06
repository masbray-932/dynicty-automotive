# Standalone upgrade and rollback runbook

1. **Rehearse.** Read the release/schema changes, restore a coordinated backup into an isolated copy, apply migrations with the migrator role, run `prisma migrate status` and regression-check data, branding, login and media. Classify changes as compatible or incompatible with the previous application. Do not use Prisma reset, schema push or guesswork to resolve drift.
2. **Build.** Prepare a complete new release directory using a reviewed commit, frozen lockfile, tested Node, customer's exact canonical URL, and production settings without real bootstrap credentials. Do not point build tasks at live data. Preserve the previous artifact. Verify the new release is readable by the service, app files are not writable, its cache directory is writable, and its upload symlink points to the **same customer's** dedicated physical root. Do not copy or delete uploads with release cleanup.
3. **Quiesce and snapshot.** Stop only the target service, block independent writes, make and verify an encrypted DB/media/config backup, and record current release pointer and recovery point. Stop if backup, free space, or migration readiness cannot be confirmed.
4. **Migrate and switch.** Apply checked-in migrations as migrator, confirm status, refresh runtime grants/revoke migration metadata access, and verify the expected schema. Switch the release pointer atomically on the same filesystem (example below). Start only that customer. If a unit or vhost changed, validate it separately before loading it; never reload a shared proxy on an unvalidated change.
5. **Verify.** Check process and HTTPS health, canonical origin, known inventory, authenticated settings, and new media create/read/delete. Verify the other customer's health independently if sharing a host. Reopen traffic only after acceptance. Retain the previous artifact and recovery point through the rollback window.

```sh
# Operator example inside this customer's release root; review both paths.
# Run with the customer service stopped and no existing current.new.
ln -s releases/REVIEWED_RELEASE current.new
mv -T -- current.new current
```

If the application fails before any database/data change, stop it and switch back to the known-good release using the same pointer procedure. If migrations ran, rolling back code **does not revert Prisma migrations**. Switch back only after verifying the old release is compatible with the migrated schema and data. If compatibility is unknown, a migration partially failed, or data/media has changed incompatibly, keep traffic closed, preserve logs and a new snapshot, and choose a reviewed forward fix or restore a coordinated recovery point into **new** isolated DB/media targets. Verify the recovered release against those targets and reconcile writes since the recovery point before switching. Never blindly overwrite live data, edit migration history, or delete media while switching release pointers.
