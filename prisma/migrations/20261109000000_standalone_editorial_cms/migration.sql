-- CreateEnum
CREATE TYPE "ContentPublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterEnum
ALTER TYPE "DealerContentKind" ADD VALUE 'TESTIMONIAL';

-- AlterTable
ALTER TABLE "DealerContent" ADD COLUMN     "achievements" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "history" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "mission" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "vision" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "dealerSettingsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowroomService" (
    "id" TEXT NOT NULL,
    "dealerSettingsId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "imageStorageKey" TEXT,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "status" "ContentPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "homepageVisible" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowroomService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "dealerSettingsId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "imageStorageKey" TEXT,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "status" "ContentPublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceCategory_dealerSettingsId_active_sortOrder_idx" ON "ServiceCategory"("dealerSettingsId", "active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_dealerSettingsId_id_key" ON "ServiceCategory"("dealerSettingsId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_dealerSettingsId_slug_key" ON "ServiceCategory"("dealerSettingsId", "slug");

-- CreateIndex
CREATE INDEX "ShowroomService_dealerSettingsId_status_homepageVisible_sor_idx" ON "ShowroomService"("dealerSettingsId", "status", "homepageVisible", "sortOrder");

-- CreateIndex
CREATE INDEX "ShowroomService_dealerSettingsId_categoryId_idx" ON "ShowroomService"("dealerSettingsId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ShowroomService_dealerSettingsId_slug_key" ON "ShowroomService"("dealerSettingsId", "slug");

-- CreateIndex
CREATE INDEX "Article_dealerSettingsId_status_publishedAt_idx" ON "Article"("dealerSettingsId", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Article_dealerSettingsId_slug_key" ON "Article"("dealerSettingsId", "slug");

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_dealerSettingsId_fkey" FOREIGN KEY ("dealerSettingsId") REFERENCES "DealerSettings"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ShowroomService" ADD CONSTRAINT "ShowroomService_dealerSettingsId_fkey" FOREIGN KEY ("dealerSettingsId") REFERENCES "DealerSettings"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ShowroomService" ADD CONSTRAINT "ShowroomService_dealerSettingsId_categoryId_fkey" FOREIGN KEY ("dealerSettingsId", "categoryId") REFERENCES "ServiceCategory"("dealerSettingsId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_dealerSettingsId_fkey" FOREIGN KEY ("dealerSettingsId") REFERENCES "DealerSettings"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- DB-backed normalization and publication invariants for new records only.
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), ADD CONSTRAINT "ServiceCategory_order_check" CHECK ("sortOrder" BETWEEN 0 AND 999);
ALTER TABLE "ShowroomService" ADD CONSTRAINT "ShowroomService_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), ADD CONSTRAINT "ShowroomService_order_check" CHECK ("sortOrder" BETWEEN 0 AND 999);
ALTER TABLE "Article" ADD CONSTRAINT "Article_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), ADD CONSTRAINT "Article_publication_check" CHECK (("status" = 'DRAFT' AND "publishedAt" IS NULL) OR ("status" = 'PUBLISHED' AND "publishedAt" IS NOT NULL));
