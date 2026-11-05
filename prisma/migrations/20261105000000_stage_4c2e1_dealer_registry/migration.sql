-- Expand only: no registry rows, legacy backfill, or changes to existing keys.
BEGIN;

-- CreateEnum
CREATE TYPE "DealerLifecycle" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DealerDomainVerificationState" AS ENUM ('PENDING', 'VERIFIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "DealerDomainRoutingState" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'RETIRED');

-- AlterTable
ALTER TABLE "DealerSettings" ADD COLUMN "dealerId" TEXT;

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "lifecycle" "DealerLifecycle" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerDomain" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "hostname" VARCHAR(253) NOT NULL,
    "verificationState" "DealerDomainVerificationState" NOT NULL DEFAULT 'PENDING',
    "routingState" "DealerDomainRoutingState" NOT NULL DEFAULT 'PENDING',
    "isCanonical" BOOLEAN NOT NULL DEFAULT false,
    "bindingVersion" INTEGER NOT NULL DEFAULT 1,
    "verifiedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_slug_key" ON "Dealer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DealerDomain_hostname_key" ON "DealerDomain"("hostname");

-- CreateIndex
CREATE INDEX "DealerDomain_dealerId_routingState_idx" ON "DealerDomain"("dealerId", "routingState");

-- CreateIndex
CREATE UNIQUE INDEX "DealerDomain_dealerId_id_key" ON "DealerDomain"("dealerId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "DealerSettings_dealerId_key" ON "DealerSettings"("dealerId");

-- AddForeignKey
ALTER TABLE "DealerDomain" ADD CONSTRAINT "DealerDomain_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DealerSettings" ADD CONSTRAINT "DealerSettings_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- SQL-only invariants not representable in the current Prisma schema.
ALTER TABLE "Dealer" ADD CONSTRAINT "Dealer_registered_id_check"
    CHECK ("id" <> 'default' AND char_length(btrim("id")) > 0);

CREATE FUNCTION "prevent_dealer_id_change"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW."id" IS DISTINCT FROM OLD."id" THEN
        RAISE EXCEPTION 'Dealer ID is immutable' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "Dealer_immutable_id"
    BEFORE UPDATE OF "id" ON "Dealer"
    FOR EACH ROW EXECUTE FUNCTION "prevent_dealer_id_change"();

-- Persist normalized, lower-case ASCII DNS names (including IDNA A-labels).
-- The service must perform canonicalization, IDNA validation and DNS/TLS proof.
ALTER TABLE "DealerDomain"
    ADD CONSTRAINT "DealerDomain_normalized_hostname_check"
        CHECK (
            "hostname" COLLATE "C" !~ '[^a-z0-9.-]'
            AND "hostname" COLLATE "C" ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
            AND "hostname" COLLATE "C" !~ '[.][0-9]+$'
        ),
    ADD CONSTRAINT "DealerDomain_binding_version_check" CHECK ("bindingVersion" >= 1),
    ADD CONSTRAINT "DealerDomain_verified_requires_timestamp"
        CHECK ("verificationState" <> 'VERIFIED' OR "verifiedAt" IS NOT NULL),
    ADD CONSTRAINT "DealerDomain_active_requires_verification"
        CHECK ("routingState" <> 'ACTIVE' OR ("verificationState" = 'VERIFIED' AND "activatedAt" IS NOT NULL)),
    ADD CONSTRAINT "DealerDomain_canonical_requires_active"
        CHECK (NOT "isCanonical" OR "routingState" = 'ACTIVE');

-- At most one canonical domain, even with concurrent writers.
-- Exactly one for an active dealer requires a future transactional workflow.
CREATE UNIQUE INDEX "DealerDomain_one_canonical_per_dealer"
    ON "DealerDomain" ("dealerId")
    WHERE "isCanonical" = true;

COMMIT;
