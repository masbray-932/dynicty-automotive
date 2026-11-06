-- Expand only. Preserve existing keys, FK relations, and inventory rows.
-- Nullable owners intentionally use the default MATCH SIMPLE behavior: a
-- non-null owner must match the parent owner; NULL preserves the legacy path.
BEGIN;

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN "dealerId" TEXT;

-- AlterTable
ALTER TABLE "CarModel" ADD COLUMN "dealerId" TEXT;

-- AlterTable
ALTER TABLE "Car" ADD COLUMN "dealerId" TEXT;

-- AlterTable
ALTER TABLE "CarImage" ADD COLUMN "dealerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Brand_dealerId_id_key" ON "Brand"("dealerId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CarModel_dealerId_id_key" ON "CarModel"("dealerId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CarModel_dealerId_brandId_id_key" ON "CarModel"("dealerId", "brandId", "id");

-- CreateIndex
CREATE INDEX "Car_dealerId_brandId_modelId_idx" ON "Car"("dealerId", "brandId", "modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Car_dealerId_id_key" ON "Car"("dealerId", "id");

-- CreateIndex
CREATE INDEX "CarImage_dealerId_carId_idx" ON "CarImage"("dealerId", "carId");

-- CreateIndex
CREATE UNIQUE INDEX "CarImage_dealerId_id_key" ON "CarImage"("dealerId", "id");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CarModel" ADD CONSTRAINT "CarModel_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CarModel" ADD CONSTRAINT "CarModel_dealerId_brandId_fkey" FOREIGN KEY ("dealerId", "brandId") REFERENCES "Brand"("dealerId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_dealerId_brandId_modelId_fkey" FOREIGN KEY ("dealerId", "brandId", "modelId") REFERENCES "CarModel"("dealerId", "brandId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CarImage" ADD CONSTRAINT "CarImage_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CarImage" ADD CONSTRAINT "CarImage_dealerId_carId_fkey" FOREIGN KEY ("dealerId", "carId") REFERENCES "Car"("dealerId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

COMMIT;
