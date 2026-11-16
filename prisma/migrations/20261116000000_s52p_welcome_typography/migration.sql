ALTER TABLE "DealerContent"
  ADD COLUMN "welcomeHeadingDesktopPx" INTEGER,
  ADD COLUMN "welcomeHeadingMobilePx" INTEGER,
  ADD COLUMN "welcomeBodyDesktopPx" INTEGER,
  ADD COLUMN "welcomeBodyMobilePx" INTEGER;

ALTER TABLE "DealerContent"
  ADD CONSTRAINT "DealerContent_welcomeHeadingDesktopPx_check" CHECK ("welcomeHeadingDesktopPx" IS NULL OR "welcomeHeadingDesktopPx" BETWEEN 32 AND 72),
  ADD CONSTRAINT "DealerContent_welcomeHeadingMobilePx_check" CHECK ("welcomeHeadingMobilePx" IS NULL OR "welcomeHeadingMobilePx" BETWEEN 24 AND 48),
  ADD CONSTRAINT "DealerContent_welcomeBodyDesktopPx_check" CHECK ("welcomeBodyDesktopPx" IS NULL OR "welcomeBodyDesktopPx" BETWEEN 14 AND 24),
  ADD CONSTRAINT "DealerContent_welcomeBodyMobilePx_check" CHECK ("welcomeBodyMobilePx" IS NULL OR "welcomeBodyMobilePx" BETWEEN 14 AND 22);
