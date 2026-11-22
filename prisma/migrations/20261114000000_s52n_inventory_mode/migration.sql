-- Dealer-scoped storefront inventory policy. Existing dealers retain both
-- conditions until an administrator explicitly changes this setting.
CREATE TYPE "InventoryMode" AS ENUM ('BOTH', 'USED_ONLY', 'NEW_ONLY');

ALTER TABLE "DealerSettings"
ADD COLUMN "inventoryMode" "InventoryMode" NOT NULL DEFAULT 'BOTH';
