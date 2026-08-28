-- Customer portal.
--
-- Five columns and one rename. The portal is built almost entirely on models
-- that already existed — appointments, sourcing requests, supplier payments,
-- exchange requests, exceptions, tickets, notifications — so what is added here
-- is only what those models could not express: the line between what staff
-- write to each other and what the customer is allowed to read, one attachment
-- on two request forms, and how a customer wants to be contacted.

-- Separates the desk's working notes from the customer conversation. FALSE is
-- visible-to-customer, so notes written before this column existed stay
-- readable rather than silently disappearing from a thread.
ALTER TABLE "TicketNote" ADD COLUMN "internal" BOOLEAN NOT NULL DEFAULT false;

-- The same line on an investigation timeline, defaulted the other way: most
-- entries here are the queue talking to itself, and a customer update is the
-- deliberate act.
ALTER TABLE "ExceptionEvent" ADD COLUMN "customerVisible" BOOLEAN NOT NULL DEFAULT false;

-- One attachment each on the two forms a customer fills in about goods they
-- have not shipped yet.
ALTER TABLE "SourcingRequest" ADD COLUMN "documentUrl" TEXT,
                              ADD COLUMN "documentName" TEXT;
ALTER TABLE "Appointment"     ADD COLUMN "documentUrl" TEXT,
                              ADD COLUMN "documentName" TEXT;

-- Contact preferences. In-app is not here because it is not optional.
ALTER TABLE "Customer" ADD COLUMN "notifyWhatsapp" BOOLEAN NOT NULL DEFAULT true,
                       ADD COLUMN "notifyEmail"    BOOLEAN NOT NULL DEFAULT true,
                       ADD COLUMN "notifySms"      BOOLEAN NOT NULL DEFAULT false;

-- ARRIVED_DAR is Dar es Salaam. AITRANSIT flies into Lusaka.
--
-- RENAME rather than the add-new/migrate/drop-old dance Prisma generates for an
-- enum change: a rename keeps every existing row pointing at the same value,
-- takes no lock worth worrying about, and cannot half-apply. The dance can, and
-- this value is on customer message history.
ALTER TYPE "MessageKind" RENAME VALUE 'ARRIVED_DAR' TO 'ARRIVED_ZAMBIA';
