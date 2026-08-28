-- Three cargo categories, matching what the desk actually sorts by.
--
-- Normal goods (Guangzhou) · Electronics (Hong Kong) · Liquid & special (Hong Kong)
--
-- SPECIAL_CATEGORY is RENAMED rather than replaced. It already means "the Hong
-- Kong route at the flat rate", which is exactly what Liquid & special means, so
-- a rename keeps every shipment, invoice, pricing rule and booking pointing at
-- the same value it always did. Not one priced row moves.
--
-- ELECTRONICS is added, and the rows that belong in it are moved by the NEXT
-- migration. Postgres refuses to use a new enum value in the transaction that
-- created it, which is why this is two files rather than one.
ALTER TYPE "CargoCategory" RENAME VALUE 'SPECIAL_CATEGORY' TO 'LIQUID_SPECIAL';
ALTER TYPE "CargoCategory" ADD VALUE 'ELECTRONICS';
