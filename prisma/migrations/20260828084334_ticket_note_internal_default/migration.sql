-- TicketNote.internal defaults to hidden, and every existing note is hidden.
--
-- The previous migration added this column defaulting to FALSE, which made
-- every note ever written by the support desk visible in the new customer
-- portal. Those notes were written when no customer could read them and they
-- read that way: they are the desk talking to itself.
--
-- The backfill is unconditional rather than date-bounded because it runs before
-- the portal is released, so every row present is a staff note by definition.
-- Portal replies pass internal = false explicitly and are unaffected by the
-- default.
ALTER TABLE "TicketNote" ALTER COLUMN "internal" SET DEFAULT true;
UPDATE "TicketNote" SET "internal" = true;
