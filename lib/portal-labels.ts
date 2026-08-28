import type { Tone } from "@/components/portal/ui";

/**
 * What a customer is told a status means.
 *
 * SEPARATE FROM lib/constants.ts ON PURPOSE. The staff labels there are written
 * for somebody who works here: "WAITING_CUSTOMER" tells a clerk the ball is not
 * in their court, and tells a customer nothing. Every map below answers the
 * question the customer is actually asking — is this finished, is it waiting on
 * me, should I be worried — and several deliberately collapse states that matter
 * internally and not to them.
 *
 * The tone is part of the meaning, not decoration. Amber means "you need to do
 * something". Emerald means "done, nothing to do". Neutral means "we are
 * working, sit tight". Getting that wrong makes a portal that shouts.
 */

type Label = { label: string; tone: Tone; hint?: string };

/* ---------------------------------------------------------------- invoices */

export const INVOICE_LABEL: Record<string, Label> = {
  UNPAID: { label: "Unpaid", tone: "amber", hint: "Payment due" },
  PARTIALLY_PAID: {
    label: "Part paid",
    tone: "amber",
    hint: "Some of the balance is still owing",
  },
  PAID: { label: "Paid", tone: "emerald", hint: "Nothing outstanding" },
  VOID: { label: "Cancelled", tone: "neutral", hint: "This invoice was withdrawn" },
  WRITTEN_OFF: {
    label: "Written off",
    tone: "neutral",
    hint: "Closed by Finance — no payment expected",
  },
  DRAFT: { label: "Draft", tone: "neutral" },
};

export const CREDIT_LABEL: Record<string, Label> = {
  NONE: { label: "Cash", tone: "neutral" },
  REQUESTED: {
    label: "Credit requested",
    tone: "amber",
    hint: "Finance has not decided yet",
  },
  APPROVED: {
    label: "On credit",
    tone: "emerald",
    hint: "Collect now, pay by the agreed date",
  },
  REJECTED: {
    label: "Credit declined",
    tone: "rose",
    hint: "Payment is needed before collection",
  },
};

export const SUBMISSION_LABEL: Record<string, Label> = {
  PENDING: {
    label: "With Finance",
    tone: "amber",
    hint: "Sent — waiting for Finance to check it against the account",
  },
  VERIFIED: { label: "Confirmed", tone: "emerald", hint: "Matched and applied" },
  REJECTED: {
    label: "Not matched",
    tone: "rose",
    hint: "Finance could not find this payment",
  },
  WITHDRAWN: { label: "Withdrawn", tone: "neutral" },
};

/* -------------------------------------------------------------- collection */

export const PICKUP_NOTE_LABEL: Record<string, Label> = {
  ACTIVE: {
    label: "Ready to use",
    tone: "emerald",
    hint: "Show this at the warehouse",
  },
  USED: { label: "Collected", tone: "neutral", hint: "Cargo has been handed over" },
  CANCELLED: { label: "Cancelled", tone: "rose" },
};

export const APPOINTMENT_LABEL: Record<string, Label> = {
  REQUESTED: {
    label: "Requested",
    tone: "amber",
    hint: "We have your request and will confirm a time",
  },
  CONFIRMED: { label: "Confirmed", tone: "emerald" },
  RESCHEDULED: {
    label: "Moved",
    tone: "amber",
    hint: "We proposed a different time — check the date",
  },
  COMPLETED: { label: "Done", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const APPOINTMENT_KIND: Record<string, string> = {
  CARGO_PICKUP: "Cargo pickup",
  SUPPLIER_VISIT: "Supplier visit",
  FACTORY_VISIT: "Factory visit",
  MARKET_VISIT: "Market visit",
  SOURCING_HELP: "Sourcing help",
  GOODS_INSPECTION: "Goods inspection",
  CONSULTATION: "Consultation",
};

/** The kinds bookable from Market & factory visits — pickups have their own page. */
export const VISIT_KINDS = [
  "SUPPLIER_VISIT",
  "FACTORY_VISIT",
  "MARKET_VISIT",
  "GOODS_INSPECTION",
  "SOURCING_HELP",
] as const;

/* ------------------------------------------------------------------- money */

export const EXCHANGE_LABEL: Record<string, Label> = {
  NEW: {
    label: "Submitted",
    tone: "neutral",
    hint: "Received — the money desk has not looked at it yet",
  },
  UNDER_REVIEW: { label: "Being reviewed", tone: "neutral" },
  QUOTED: {
    label: "Rate offered",
    tone: "amber",
    hint: "A rate has been put to you — it needs your agreement",
  },
  AWAITING_PAYMENT: {
    label: "Waiting for your funds",
    tone: "amber",
    hint: "Rate agreed — send the money to complete it",
  },
  CONFIRMED: {
    label: "Funds received",
    tone: "emerald",
    hint: "Your money is in and the rate is fixed",
  },
  COMPLETED: { label: "Completed", tone: "emerald" },
  REJECTED: { label: "Declined", tone: "rose" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const EXCHANGE_TYPE: Record<string, string> = {
  MONEY_EXCHANGE: "Money exchange",
  EXCHANGE_QUOTE: "Rate quote",
  SUPPLIER_PAYMENT: "Supplier payment",
  SEND_MONEY_CHINA: "Send money to China",
};

export const SUPPLIER_PAYMENT_LABEL: Record<string, Label> = {
  PENDING: {
    label: "Not yet paid",
    tone: "amber",
    hint: "Approved to pay — the money desk has not sent it yet",
  },
  PAID: { label: "Paid", tone: "emerald", hint: "Sent to the supplier" },
  FAILED: {
    label: "Failed",
    tone: "rose",
    hint: "The transfer did not go through — we will contact you",
  },
  REFUNDED: { label: "Refunded", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

/* ---------------------------------------------------------- china services */

export const SOURCING_LABEL: Record<string, Label> = {
  NEW: { label: "Submitted", tone: "neutral", hint: "In the Guangzhou queue" },
  IN_PROGRESS: { label: "Being worked on", tone: "neutral" },
  WAITING_CUSTOMER: {
    label: "Waiting on you",
    tone: "amber",
    hint: "We need an answer before we can carry on",
  },
  SUPPLIER_FOUND: { label: "Found", tone: "emerald" },
  COMPLETED: { label: "Completed", tone: "emerald" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

/**
 * The services a customer may ask for, worded as the flyer words them.
 *
 * These are SourcingType values. The five internal-sounding ones
 * (FIND_SUPPLIER, VERIFY_SUPPLIER…) sit alongside the five service ones
 * because the Guangzhou desk works them from one queue — see the enum's own
 * comment in schema.prisma.
 */
export const CHINA_SERVICES: {
  value: string;
  label: string;
  blurb: string;
}[] = [
  {
    value: "INSPECT_GOODS",
    label: "Goods inspection",
    blurb:
      "We open the cartons at our Guangzhou warehouse, check the goods against your order and photograph what we find.",
  },
  {
    value: "PACKING",
    label: "Free packing",
    blurb:
      "We repack loose or badly packed goods so they survive the flight. No charge.",
  },
  {
    value: "COLLECT_FROM_SUPPLIER",
    label: "Supplier collection",
    blurb:
      "We collect from your supplier's shop or factory and bring it to our warehouse.",
  },
  {
    value: "PAY_ON_COLLECTION",
    label: "Pay supplier on collection",
    blurb:
      "We settle the balance with your supplier when we collect. Raise a supplier payment for the money side.",
  },
  {
    value: "SEND_IN_ADVANCE",
    label: "Send goods in advance",
    blurb:
      "Your supplier ships to our Guangzhou warehouse before you are ready to fly it.",
  },
  {
    value: "FIND_SUPPLIER",
    label: "Sourcing help",
    blurb:
      "Tell us what you are looking for and we will find suppliers and prices in China.",
  },
  {
    value: "VERIFY_SUPPLIER",
    label: "Verify a supplier",
    blurb:
      "Before you pay somebody you found online, we check they are real and where they are.",
  },
  {
    value: "REQUEST_QUOTATION",
    label: "Request a quotation",
    blurb: "We get you a written price from a supplier you name.",
  },
];

export const SOURCING_TYPE: Record<string, string> = Object.fromEntries([
  ...CHINA_SERVICES.map((s) => [s.value, s.label]),
  ["FIND_PRODUCT", "Find a product"],
  ["BUY_ON_BEHALF", "Buy on your behalf"],
]);

/* ------------------------------------------------------- claims and support */

export const CLAIM_LABEL: Record<string, Label> = {
  OPEN: { label: "Open", tone: "amber", hint: "Logged — we are looking into it" },
  UNDER_INVESTIGATION: { label: "Being investigated", tone: "amber" },
  WAITING_CUSTOMER: {
    label: "Waiting on you",
    tone: "amber",
    hint: "We need something from you to carry on",
  },
  COMPENSATION_APPROVED: {
    label: "Compensation agreed",
    tone: "emerald",
    hint: "Finance will arrange the payment",
  },
  REPLACEMENT_APPROVED: { label: "Replacement agreed", tone: "emerald" },
  CARGO_FOUND: { label: "Cargo found", tone: "emerald" },
  RESOLVED: { label: "Resolved", tone: "emerald" },
  CLOSED: { label: "Closed", tone: "neutral" },
  WRITTEN_OFF: { label: "Closed", tone: "neutral" },
};

/**
 * The claim kinds a customer may raise, in their words.
 *
 * A deliberate subset of ExceptionType. WEIGHT_MISMATCH, WRONG_BATCH and
 * HOLD_FOR_INVESTIGATION are things the warehouse discovers, not things a
 * customer reports, and offering them on a customer form would produce claims
 * nobody can action.
 */
export const CLAIM_KINDS: { value: string; label: string; blurb: string }[] = [
  {
    value: "MISSING_SHIPMENT",
    label: "Missing cargo",
    blurb: "A box that should have arrived has not.",
  },
  {
    value: "DAMAGED_CARGO",
    label: "Damaged cargo",
    blurb: "The cargo arrived broken, wet or crushed.",
  },
  {
    value: "WRONG_ITEM",
    label: "Wrong cargo",
    blurb: "What you collected is not what you sent.",
  },
  {
    value: "PACKAGE_COUNT_MISMATCH",
    label: "Wrong number of boxes",
    blurb: "You sent or collected a different number of pieces than the record shows.",
  },
  { value: "OTHER", label: "Something else", blurb: "Anything not on this list." },
];

export const CLAIM_TYPE: Record<string, string> = {
  MISSING_SHIPMENT: "Missing cargo",
  DAMAGED_CARGO: "Damaged cargo",
  WEIGHT_MISMATCH: "Weight difference",
  PACKAGE_COUNT_MISMATCH: "Wrong number of boxes",
  WRONG_BATCH: "Wrong batch",
  WRONG_ITEM: "Wrong cargo",
  HOLD_FOR_INVESTIGATION: "Held for investigation",
  OTHER: "Other",
};

export const TICKET_LABEL: Record<string, Label> = {
  OPEN: { label: "Open", tone: "amber" },
  IN_PROGRESS: { label: "Being answered", tone: "neutral" },
  WAITING_CUSTOMER: {
    label: "Waiting on you",
    tone: "amber",
    hint: "We have asked you something",
  },
  RESOLVED: { label: "Answered", tone: "emerald" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

export const TICKET_CATEGORY: Record<string, string> = {
  PRICE_INQUIRY: "Prices",
  SHIPMENT_INQUIRY: "About my cargo",
  MISSING_CARGO: "Missing cargo",
  DAMAGED_CARGO: "Damaged cargo",
  SOURCING: "Sourcing",
  GENERAL: "General question",
  COMPLAINT: "Complaint",
  FEEDBACK: "Feedback",
};

/** The categories a customer picks from when opening a thread. */
export const TICKET_CATEGORY_OPTIONS = [
  "SHIPMENT_INQUIRY",
  "PRICE_INQUIRY",
  "SOURCING",
  "GENERAL",
  "COMPLAINT",
  "FEEDBACK",
] as const;

/* --------------------------------------------------------------- fallbacks */

/**
 * Read a label map without crashing on a value it has not heard of.
 *
 * Enums grow. A status added to the database and not to a map above should
 * render as itself, tidied — not throw on a page a customer is reading.
 */
export function labelFor(
  map: Record<string, Label>,
  key: string | null | undefined
): Label {
  if (!key) return { label: "—", tone: "neutral" };
  return (
    map[key] ?? {
      label: key.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()),
      tone: "neutral",
    }
  );
}
