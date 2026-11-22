ALTER TABLE "DealerContent"
  DROP CONSTRAINT "DealerContent_welcomeHeadingMobilePx_check",
  DROP CONSTRAINT "DealerContent_welcomeBodyMobilePx_check";

-- Values that were valid under the former 14px minimum are normalized to the
-- new accessibility floor. Every value already inside the new range is kept.
UPDATE "DealerContent"
SET "welcomeBodyMobilePx" = 16
WHERE "welcomeBodyMobilePx" IS NOT NULL AND "welcomeBodyMobilePx" < 16;

ALTER TABLE "DealerContent"
  ADD CONSTRAINT "DealerContent_welcomeHeadingMobilePx_check" CHECK ("welcomeHeadingMobilePx" IS NULL OR "welcomeHeadingMobilePx" BETWEEN 16 AND 48),
  ADD CONSTRAINT "DealerContent_welcomeBodyMobilePx_check" CHECK ("welcomeBodyMobilePx" IS NULL OR "welcomeBodyMobilePx" BETWEEN 16 AND 22);
