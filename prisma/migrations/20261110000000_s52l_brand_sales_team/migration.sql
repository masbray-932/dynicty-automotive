-- Additive CMS presentation fields; existing brand IDs and relationships remain unchanged.
ALTER TABLE "Brand"
ADD COLUMN "logoStorageKey" TEXT,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Brand_dealerId_active_sortOrder_idx" ON "Brand"("dealerId", "active", "sortOrder");

CREATE TABLE "SalesTeamMember" (
    "id" TEXT NOT NULL,
    "dealerSettingsId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageStorageKey" TEXT,
    "whatsappNumber" TEXT,
    "biography" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalesTeamMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SalesTeamMember_dealerSettingsId_id_key" ON "SalesTeamMember"("dealerSettingsId", "id");
CREATE INDEX "SalesTeamMember_dealerSettingsId_active_sortOrder_idx" ON "SalesTeamMember"("dealerSettingsId", "active", "sortOrder");
ALTER TABLE "SalesTeamMember" ADD CONSTRAINT "SalesTeamMember_dealerSettingsId_fkey" FOREIGN KEY ("dealerSettingsId") REFERENCES "DealerSettings"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
