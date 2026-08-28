-- Terms of business: what a customer agreed to, and when.
--
-- Two things, answering two questions.
--
-- Customer.termsVersion / termsAcceptedAt is the GATE. Every portal page asks
-- "has this person accepted the current terms", and a join to answer a
-- two-column question on every page load is a join on every page load. Both are
-- nullable because most customers were created at a counter in Guangzhou and
-- have never seen a terms page; they meet the acceptance screen on first
-- sign-in.
--
-- TermsAcceptance is the EVIDENCE, and nothing in it is ever overwritten.
-- customerId is nullable on purpose: somebody booking a shipment or requesting
-- a pickup on the public site is doing business with us before any Customer row
-- exists, so their acceptance is recorded against the details they gave.
ALTER TABLE "Customer"
  ADD COLUMN "termsVersion"    TEXT,
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);

CREATE TABLE "TermsAcceptance" (
    "id"         TEXT NOT NULL,
    "version"    TEXT NOT NULL,
    "source"     TEXT NOT NULL,
    "customerId" TEXT,
    "name"       TEXT,
    "phone"      TEXT,
    "email"      TEXT,
    "ipAddress"  TEXT,
    "userAgent"  TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermsAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TermsAcceptance_customerId_acceptedAt_idx"
  ON "TermsAcceptance"("customerId", "acceptedAt");
CREATE INDEX "TermsAcceptance_version_acceptedAt_idx"
  ON "TermsAcceptance"("version", "acceptedAt");

-- SetNull, not Cascade. Deleting a customer must not delete the record that
-- they once agreed to our terms — that record is why we can defend a charge.
ALTER TABLE "TermsAcceptance"
  ADD CONSTRAINT "TermsAcceptance_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
