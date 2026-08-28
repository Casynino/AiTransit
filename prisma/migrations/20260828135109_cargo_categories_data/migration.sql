-- Move the rows onto the three categories.
--
-- TWO MOVES, BOTH PRICING-NEUTRAL, AND THAT IS WHY THIS IS SAFE TO DO ON LIVE
-- DATA. Wigs were priced identically to normal goods at every weight band, and
-- electronics were already on the same flat rate as the rest of the Hong Kong
-- route. No consignment's quote changes, and confirmed invoices carry their own
-- frozen figures regardless.

-- ── 1. Wigs fold into normal goods ─────────────────────────────────────────
-- The six hair items survive as ITEMS: only their category changes, so a
-- shipment of braiding hair still says braiding hair on the invoice.
--
-- EXCEPT WHERE THE NAME ALREADY EXISTS. CargoType is unique on (category, name)
-- and both categories carry an "Others". A straight move violates the
-- constraint, so a colliding item is MERGED: everything recorded against the
-- wig version is repointed at the normal-goods one, and the duplicate is
-- deleted. Written as a general rule rather than a special case for "Others",
-- because the next person to add an item to both lists should not have to
-- rediscover this.
UPDATE "Shipment" s SET "cargoTypeId" = keep."id"
FROM "CargoType" dup
JOIN "CargoType" keep ON keep."category" = 'NORMAL_GOODS' AND keep."name" = dup."name"
WHERE dup."category" = 'WIGS' AND s."cargoTypeId" = dup."id";

UPDATE "PricingRule" r SET "cargoTypeId" = keep."id"
FROM "CargoType" dup
JOIN "CargoType" keep ON keep."category" = 'NORMAL_GOODS' AND keep."name" = dup."name"
WHERE dup."category" = 'WIGS' AND r."cargoTypeId" = dup."id";

DELETE FROM "CargoType" dup
WHERE dup."category" = 'WIGS'
  AND EXISTS (
    SELECT 1 FROM "CargoType" keep
    WHERE keep."category" = 'NORMAL_GOODS' AND keep."name" = dup."name"
  );

UPDATE "CargoType"       SET "category"      = 'NORMAL_GOODS' WHERE "category"      = 'WIGS';
UPDATE "Shipment"        SET "cargoCategory" = 'NORMAL_GOODS' WHERE "cargoCategory" = 'WIGS';
UPDATE "BookingRequest"  SET "cargoCategory" = 'NORMAL_GOODS' WHERE "cargoCategory" = 'WIGS';

-- The WIGS pricing rules are deleted rather than moved: NORMAL_GOODS already
-- has rules for the same two weight bands at the same prices, and two identical
-- category rules would make "which one applied" unanswerable.
DELETE FROM "PricingRule" WHERE "category" = 'WIGS' AND "cargoTypeId" IS NULL;
UPDATE "PricingRule" SET "category" = 'NORMAL_GOODS' WHERE "category" = 'WIGS';

-- ── 2. Electronics come out of liquid & special ────────────────────────────
-- By ITEM NAME, not by guesswork. Each of these is unambiguously a handset,
-- a computer or a screen; what is left behind — medicines, oils, cosmetics,
-- batteries, speakers, printers — is what "liquid & special" has always meant.
UPDATE "CargoType" SET "category" = 'ELECTRONICS'
WHERE "category" = 'LIQUID_SPECIAL'
  AND "name" IN (
    'Smart Phone (Full Box)', 'Smart Phone (Unboxed)', 'Laptop', 'Tablet',
    'Kids Tablet', 'Smart Watch', 'Camera', 'AirPods', 'Documents',
    'LED Displays'
  );

-- Shipments and pricing rules follow the item they were recorded against, so a
-- laptop consignment lands in Electronics because it is a laptop, not because
-- somebody decided it should.
UPDATE "Shipment" s SET "cargoCategory" = 'ELECTRONICS'
FROM "CargoType" t
WHERE s."cargoTypeId" = t."id"
  AND t."category" = 'ELECTRONICS'
  AND s."cargoCategory" = 'LIQUID_SPECIAL';

UPDATE "PricingRule" r SET "category" = 'ELECTRONICS'
FROM "CargoType" t
WHERE r."cargoTypeId" = t."id"
  AND t."category" = 'ELECTRONICS'
  AND r."category" = 'LIQUID_SPECIAL';

-- The category-wide rule for the Hong Kong route is duplicated onto Electronics
-- at the same price, so both categories quote exactly what they quoted before.
--
-- Guarded by NOT EXISTS so replaying this migration cannot leave two identical
-- category rules, which would make "which one applied" unanswerable.
INSERT INTO "PricingRule" (
  "id", "category", "cargoTypeId", "method", "price", "currency",
  "minWeightKg", "maxWeightKg", "minChargeableKg", "minCharge",
  "effectiveFrom", "active", "notes", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text, 'ELECTRONICS', NULL, "method", "price", "currency",
  "minWeightKg", "maxWeightKg", "minChargeableKg", "minCharge",
  "effectiveFrom", "active", "notes", NOW(), NOW()
FROM "PricingRule" src
WHERE src."category" = 'LIQUID_SPECIAL'
  AND src."cargoTypeId" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "PricingRule" done
    WHERE done."category" = 'ELECTRONICS' AND done."cargoTypeId" IS NULL
  );
