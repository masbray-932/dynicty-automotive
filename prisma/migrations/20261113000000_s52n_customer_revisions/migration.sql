-- S5.2N adds dealer-scoped storefront configuration without changing existing content.
ALTER TABLE "DealerSettings"
  ADD COLUMN "faviconStorageKey" TEXT,
  ADD COLUMN "whatsappWidgetEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "whatsappWidgetMessage" VARCHAR(500) NOT NULL DEFAULT '';
