# Storage

## Boundary

Media code depends on the `StorageProvider` interface (`put`, `delete`, and `publicUrl`). `LocalStorageProvider` is for development and writes under ignored `public/uploads/`. `R2StorageProvider` reserves the S3-compatible production boundary and intentionally throws until the adapter is implemented and verified in a later phase.

## Upload flow

Future authenticated upload actions will validate MIME type and size, derive a server-owned key with `createCarImageKey`, send bytes to the configured provider, then create `CarImage` only after storage succeeds. A database failure must trigger compensating object deletion.

Keys use `cars/{carId}/{uniqueSuffix}-{sanitizedFilename}`. Raw client paths are never trusted. Traversal, absolute paths, and backslashes are rejected.

## Ordering and cover behavior

`sortOrder` defines presentation order. Reordering occurs in one database transaction. Exactly one image per car should be primary when images exist; changing the primary image clears the previous flag in the same transaction. Deletion removes the database row and object safely, with retry/audit behavior added alongside CRUD.

## Future R2 integration

Set `STORAGE_PROVIDER=r2` and all `R2_*` values only after installing an S3-compatible client and implementing the adapter. Credentials remain server-only. Public delivery uses `R2_PUBLIC_URL`; secrets must never enter client bundles.

## Phase 1 implementation

Uploads accept JPEG, PNG, and WEBP up to 8 MB. Both declared MIME and binary signature are checked before storage. The storage object is written first; if the database transaction fails, the object is deleted as compensation. Car/image deletion commits the database change first and then performs idempotent object cleanup. A cleanup failure is surfaced to the admin through an explicit warning so an orphan object is never silently ignored.
