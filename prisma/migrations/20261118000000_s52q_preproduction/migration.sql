CREATE TYPE "PlatformAdminRole" AS ENUM ('OWNER', 'SUPPORT');
CREATE TYPE "DealerAdminRole" AS ENUM ('OWNER', 'ADMIN');
CREATE TYPE "DealerMembershipStatus" AS ENUM ('ACTIVE', 'REVOKED');

ALTER TABLE "AdminUser"
  ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "platformRole" "PlatformAdminRole",
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

UPDATE "AdminUser"
SET "emailVerifiedAt" = "createdAt", "platformRole" = 'OWNER';

ALTER TABLE "DealerSettings" ADD COLUMN "inventoryUpdatedAt" TIMESTAMP(3);

UPDATE "DealerSettings"
SET "inventoryUpdatedAt" = COALESCE(
  (SELECT MAX("updatedAt") FROM "Car" WHERE "status" = 'AVAILABLE' AND "dealerId" IS NULL),
  "DealerSettings"."updatedAt"
)
WHERE "id" = 'default' AND "dealerId" IS NULL;

CREATE UNIQUE INDEX "ShowroomService_dealerSettingsId_id_key" ON "ShowroomService"("dealerSettingsId", "id");

CREATE TABLE "AdminDealerMembership" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "dealerSettingsId" TEXT NOT NULL,
  "role" "DealerAdminRole" NOT NULL DEFAULT 'ADMIN',
  "status" "DealerMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminDealerMembership_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AdminDealerMembership" ("id", "adminId", "dealerSettingsId", "role", "status", "activatedAt", "createdAt", "updatedAt")
SELECT CONCAT('legacy-', MD5(a."id")), a."id", 'default', 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "AdminUser" a
WHERE EXISTS (SELECT 1 FROM "DealerSettings" d WHERE d."id" = 'default' AND d."dealerId" IS NULL);

CREATE TABLE "AdminInvitation" (
  "id" TEXT NOT NULL,
  "dealerSettingsId" TEXT NOT NULL,
  "invitedEmail" TEXT NOT NULL,
  "role" "DealerAdminRole" NOT NULL DEFAULT 'OWNER',
  "tokenHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "acceptedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminEmailChangeToken" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "newEmail" TEXT NOT NULL,
  "tokenHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminEmailChangeToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "dealerSettingsId" TEXT,
  "actorAdminId" TEXT,
  "targetAdminId" TEXT,
  "action" VARCHAR(80) NOT NULL,
  "detail" VARCHAR(500) NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceCtaConfig" (
  "id" TEXT NOT NULL,
  "dealerSettingsId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "heading" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "headingDesktopPx" INTEGER NOT NULL DEFAULT 40,
  "descriptionDesktopPx" INTEGER NOT NULL DEFAULT 18,
  "headingMobilePx" INTEGER NOT NULL DEFAULT 28,
  "descriptionMobilePx" INTEGER NOT NULL DEFAULT 16,
  "backgroundColor" VARCHAR(7) NOT NULL DEFAULT '#C8102E',
  "textColor" VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
  "imageStorageKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceCtaConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceCtaConfig_headingDesktopPx_check" CHECK ("headingDesktopPx" BETWEEN 16 AND 72),
  CONSTRAINT "ServiceCtaConfig_descriptionDesktopPx_check" CHECK ("descriptionDesktopPx" BETWEEN 14 AND 32),
  CONSTRAINT "ServiceCtaConfig_headingMobilePx_check" CHECK ("headingMobilePx" BETWEEN 16 AND 48),
  CONSTRAINT "ServiceCtaConfig_descriptionMobilePx_check" CHECK ("descriptionMobilePx" BETWEEN 16 AND 32),
  CONSTRAINT "ServiceCtaConfig_backgroundColor_check" CHECK ("backgroundColor" ~ '^#[0-9A-F]{6}$'),
  CONSTRAINT "ServiceCtaConfig_textColor_check" CHECK ("textColor" ~ '^#[0-9A-F]{6}$')
);

CREATE TABLE "ServiceCtaButton" (
  "id" TEXT NOT NULL,
  "dealerSettingsId" TEXT NOT NULL,
  "serviceCtaId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "whatsappNumber" TEXT NOT NULL,
  "backgroundColor" VARCHAR(7) NOT NULL DEFAULT '#111111',
  "textColor" VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceCtaButton_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceCtaButton_backgroundColor_check" CHECK ("backgroundColor" ~ '^#[0-9A-F]{6}$'),
  CONSTRAINT "ServiceCtaButton_textColor_check" CHECK ("textColor" ~ '^#[0-9A-F]{6}$')
);

CREATE UNIQUE INDEX "AdminDealerMembership_adminId_dealerSettingsId_key" ON "AdminDealerMembership"("adminId", "dealerSettingsId");
CREATE INDEX "AdminDealerMembership_dealerSettingsId_status_role_idx" ON "AdminDealerMembership"("dealerSettingsId", "status", "role");
CREATE UNIQUE INDEX "AdminInvitation_tokenHash_key" ON "AdminInvitation"("tokenHash");
CREATE INDEX "AdminInvitation_dealerSettingsId_invitedEmail_expiresAt_idx" ON "AdminInvitation"("dealerSettingsId", "invitedEmail", "expiresAt");
CREATE UNIQUE INDEX "AdminEmailChangeToken_tokenHash_key" ON "AdminEmailChangeToken"("tokenHash");
CREATE INDEX "AdminEmailChangeToken_adminId_expiresAt_idx" ON "AdminEmailChangeToken"("adminId", "expiresAt");
CREATE INDEX "AdminAuditLog_dealerSettingsId_createdAt_idx" ON "AdminAuditLog"("dealerSettingsId", "createdAt");
CREATE INDEX "AdminAuditLog_actorAdminId_createdAt_idx" ON "AdminAuditLog"("actorAdminId", "createdAt");
CREATE UNIQUE INDEX "ServiceCtaConfig_dealerSettingsId_id_key" ON "ServiceCtaConfig"("dealerSettingsId", "id");
CREATE UNIQUE INDEX "ServiceCtaConfig_dealerSettingsId_serviceId_key" ON "ServiceCtaConfig"("dealerSettingsId", "serviceId");
CREATE INDEX "ServiceCtaConfig_dealerSettingsId_enabled_idx" ON "ServiceCtaConfig"("dealerSettingsId", "enabled");
CREATE UNIQUE INDEX "ServiceCtaButton_dealerSettingsId_id_key" ON "ServiceCtaButton"("dealerSettingsId", "id");
CREATE INDEX "ServiceCtaButton_dealerSettingsId_serviceCtaId_sortOrder_idx" ON "ServiceCtaButton"("dealerSettingsId", "serviceCtaId", "sortOrder");

ALTER TABLE "AdminDealerMembership" ADD CONSTRAINT "AdminDealerMembership_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminDealerMembership" ADD CONSTRAINT "AdminDealerMembership_dealerSettingsId_fkey" FOREIGN KEY ("dealerSettingsId") REFERENCES "DealerSettings"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_dealerSettingsId_fkey" FOREIGN KEY ("dealerSettingsId") REFERENCES "DealerSettings"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminInvitation" ADD CONSTRAINT "AdminInvitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminEmailChangeToken" ADD CONSTRAINT "AdminEmailChangeToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceCtaConfig" ADD CONSTRAINT "ServiceCtaConfig_dealerSettingsId_fkey" FOREIGN KEY ("dealerSettingsId") REFERENCES "DealerSettings"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "ServiceCtaConfig" ADD CONSTRAINT "ServiceCtaConfig_dealerSettingsId_serviceId_fkey" FOREIGN KEY ("dealerSettingsId", "serviceId") REFERENCES "ShowroomService"("dealerSettingsId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE "ServiceCtaButton" ADD CONSTRAINT "ServiceCtaButton_dealerSettingsId_serviceCtaId_fkey" FOREIGN KEY ("dealerSettingsId", "serviceCtaId") REFERENCES "ServiceCtaConfig"("dealerSettingsId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;
