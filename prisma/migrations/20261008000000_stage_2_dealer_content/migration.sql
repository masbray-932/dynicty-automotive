-- CreateEnum
CREATE TYPE "DealerContentKind" AS ENUM ('MAIN_BANNER', 'PROMO_BANNER', 'ADVANTAGE', 'FAQ', 'LEASING_PARTNER');

-- CreateTable
CREATE TABLE "DealerContent" (
    "dealerId" TEXT NOT NULL,
    "welcomeTitle" TEXT NOT NULL DEFAULT '',
    "welcomeBody" TEXT NOT NULL DEFAULT '',
    "welcomeActive" BOOLEAN NOT NULL DEFAULT false,
    "aboutSummary" TEXT NOT NULL DEFAULT '',
    "aboutStory" TEXT NOT NULL DEFAULT '',
    "aboutActive" BOOLEAN NOT NULL DEFAULT false,
    "showroomKey" TEXT,
    "showroomAlt" TEXT NOT NULL DEFAULT '',
    "operatingHours" TEXT NOT NULL DEFAULT '',
    "operatingHoursActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerContent_pkey" PRIMARY KEY ("dealerId")
);

-- CreateTable
CREATE TABLE "DealerContentItem" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "kind" "DealerContentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "mediaKey" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealerContentItem_dealerId_kind_active_sortOrder_idx" ON "DealerContentItem"("dealerId", "kind", "active", "sortOrder");

-- AddForeignKey
ALTER TABLE "DealerContent" ADD CONSTRAINT "DealerContent_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "DealerSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerContentItem" ADD CONSTRAINT "DealerContentItem_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "DealerSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
