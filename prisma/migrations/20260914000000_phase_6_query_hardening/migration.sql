-- Support bounded public inventory, sitemap, and recent-vehicle queries.
CREATE INDEX "Car_status_updatedAt_idx" ON "Car"("status", "updatedAt");
