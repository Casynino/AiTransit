import "server-only";

import type { MessageKind } from "@prisma/client";

import { COMPANY, PAYMENT_METHODS, STORAGE_POLICY } from "@/lib/constants";
import { formatLocal, formatUsd } from "@/lib/fx";

/**
 * What we say to customers, and when.
 *
 * Two honest constraints shaped this:
 *
 *  1. The system does not deliver anything. It composes the wording and opens
 *     WhatsApp with it; a member of staff presses send. So a logged message
 *     means "we contacted them", never "the system notified them" — anything
 *     stronger would be a claim the code cannot back up.
 *  2. ENGLISH, and only English. Target Express wrote these in Kiswahili with
 *     an English tail, which was right for Lusaka es Salaam. AITRANSIT bills
 *     into Lusaka, where the trade, the invoice and the WhatsApp conversation
 *     are all in English — so a bilingual message here would be half of it
 *     wasted and the wrong half hard to predict.
 */

export type MessageContext = {
  customerName: string;
  trackingNumber?: string | null;
  description?: string | null;
  batchNumber?: string | null;
  invoiceNumber?: string | null;
  amountUsd?: number | null;
  amountLocal?: number | null;
  localCurrency?: string | null;
  storageDays?: number | null;
  /** Off the cargo record. Nobody at a desk should be typing a weight. */
  weightKg?: number | null;
  /**
   * How the freight figure was reached: the per-kilo rate, or the per-item
   * price, exactly as the invoice states it.
   *
   * The customer could see the amount and the exchange rate but never the
   * arithmetic between them — so "USD 12.00" arrived as a number to be taken
   * on trust. This is the line that makes it checkable: rate × weight.
   */
  freightBasis?: string | null;
  /**
   * The rate FROZEN ON THIS INVOICE, never today's published one.
   *
   * A customer who was quoted at 2,700 and reads 2,800 next month believes the
   * bill changed. The invoice carries its own rate precisely so that cannot
   * happen, and this is the only rate a message may print.
   */
  exchangeRate?: number | null;
};

export const MESSAGE_KIND_LABELS: Record<MessageKind, string> = {
  SHIPMENT_REGISTERED: "Cargo received in China",
  IN_TRANSIT: "In transit",
  ARRIVED_DAR: "Arrived in Zambia",
  INVOICE_ISSUED: "Invoice issued",
  PAYMENT_REMINDER: "Payment reminder",
  READY_FOR_PICKUP: "Ready for pickup",
  STORAGE_REMINDER: "Storage reminder",
  GENERAL: "General message",
};

export const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  PHONE: "Phone call",
  SMS: "SMS",
  EMAIL: "Email",
  IN_PERSON: "In person",
  SOCIAL: "Social media",
};

/**
 * Where customers go to track.
 *
 * Read from the environment because the message goes out to a real person — a
 * wrong host here is a dead link in a customer's WhatsApp, not a broken page a
 * developer notices.
 *
 * A localhost value is REFUSED rather than used. NEXT_PUBLIC_SITE_URL is
 * "http://localhost:3000" in this repo's .env, which is correct for a dev
 * server and catastrophic in a customer message: anybody testing a reminder
 * from their own machine would send a link that resolves to the customer's own
 * phone. The public domain is the only sane answer for a message leaving the
 * building, so that is what a local value falls back to.
 */
const PUBLIC_HOST = (() => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!configured) return "https://aitransit.co.zm";
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(configured)
    ? "https://aitransit.co.zm"
    : configured;
})();

const TRACK_URL = `${PUBLIC_HOST}/track`;

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function money(context: MessageContext) {
  const parts: string[] = [];
  if (context.amountUsd !== null && context.amountUsd !== undefined) {
    parts.push(formatUsd(context.amountUsd));
  }
  if (context.amountLocal !== null && context.amountLocal !== undefined) {
    parts.push(formatLocal(context.amountLocal, context.localCurrency ?? "ZMW"));
  }
  return parts.join(" / ");
}

/** Composes the message body for a kind. Editable before it is sent. */
/**
 * The two messages that ask a customer for money, in one shape.
 *
 * An invoice being issued and a payment being chased are the same conversation
 * at two moments — here is the cargo, here is what it weighs, here is the rate
 * we used, here is the amount, here is where to send it. Only the opening line
 * differs, so only the opening line is passed in: two hand-written versions
 * drift apart within a month and the one that drifts is the one a customer
 * reads.
 *
 * Everything a customer needs to pay correctly is here and nothing else is.
 * The weight comes off the cargo record and the rate off the invoice, so no
 * clerk types either and neither can disagree with the bill.
 *
 * Plain words, at the owner's instruction: "Invoice", not "Tax invoice".
 */
/**
 * How both money messages open.
 *
 * One sentence, one place. The invoice going out and the reminder chasing it
 * are the same news to the person receiving them — the cargo is here, safe,
 * and waiting on payment — and two copies of that sentence drift apart the
 * first time one is reworded.
 */
const ARRIVED_AND_HELD =
  "We are pleased to let you know that your cargo has arrived safely at our *Lusaka warehouse* and is ready for collection once payment is confirmed.";

function moneyMessage(context: MessageContext, opening: string) {
  const name = firstName(context.customerName);
  const tracking = context.trackingNumber ?? "";
  const bold = (text: string) => `*${text}*`;

  return [
    `📦 ${bold(COMPANY.name.toUpperCase())}`,
    ``,
    `${bold(`Hello ${name},`)}`,
    ``,
    opening,
    ``,
    `📋 ${bold("Cargo details")}`,
    ...(tracking ? [`• ${bold("Tracking No.:")} ${tracking}`] : []),
    ...(context.invoiceNumber
      ? [`• ${bold("Invoice No.:")} ${context.invoiceNumber}`]
      : []),
    ...(context.description ? [`• ${bold("Cargo:")} ${context.description}`] : []),
    ...(context.weightKg !== null && context.weightKg !== undefined
      ? [`• ${bold("Weight:")} ${context.weightKg} kg`]
      : []),
    ...(context.freightBasis
      ? [`• ${bold("Rate:")} ${context.freightBasis}`]
      : []),
    ...(context.exchangeRate
      ? [
          `• ${bold("Exchange rate:")} USD 1 = ZMW ${context.exchangeRate.toLocaleString("en-US")}`,
        ]
      : []),
    `• ${bold("Amount:")} ${bold(money(context))}`,
    ``,
    /*
      The storage policy, in the message itself.

      It was one line near the bottom with no number attached, sitting under the
      payment accounts where nobody reads. A customer who does not know the
      clock has started cannot beat it, and the first they hear of a charge is
      when it is on the bill. So it sits high up, right after the amount, with
      the free days and the daily fee taken from STORAGE_POLICY so they cannot
      drift from what the storage clock actually charges.
    */
    `📦 ${bold("STORAGE POLICY")}`,
    `Because of the volume of cargo in our warehouse, your cargo gets ${STORAGE_POLICY.freeDays} days of ${bold("free storage")} from the day it is checked in at Lusaka.`,
    `⚠️ After ${STORAGE_POLICY.freeDays} days, a ${bold(`storage fee of USD ${STORAGE_POLICY.perDayUsd} per day`)} applies until you collect.`,
    `Please collect early to avoid additional storage charges.`,
    ``,
    `📄 ${bold("See your full invoice:")}`,
    `🔗 ${TRACK_URL}${tracking ? `?q=${encodeURIComponent(tracking)}` : ""}`,
    ``,
    `💳 ${bold("How to pay")}`,
    ``,
    ...paymentBlock(bold),
    `Once you have paid, please send us the ${bold("payment proof")} so our team can verify it. As soon as payment is confirmed you will receive a ${bold("Pickup Note")} for collecting your cargo.`,
    ``,
    ...officeBlock(bold),
    `Thank you for shipping with ${bold(COMPANY.name)}.`,
    ``,
    `📞 ${bold(COMPANY.phone)}`,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function composeMessage(
  kind: MessageKind,
  context: MessageContext
): string {
  const name = firstName(context.customerName);
  const tracking = context.trackingNumber ?? "";
  const cargo = context.description ?? "your cargo";
  const sign = `\n\n${COMPANY.name}\n${COMPANY.phone}`;

  switch (kind) {
    case "SHIPMENT_REGISTERED":
      return (
        `Hello ${name}, we have received your cargo (${cargo}) at our China warehouse.\n` +
        `Tracking number: ${tracking}\n` +
        `Track it any time here: ${TRACK_URL}` +
        sign
      );

    case "IN_TRANSIT":
      return (
        `Hello ${name}, your cargo ${tracking} has left China` +
        (context.batchNumber ? ` (batch ${context.batchNumber})` : "") +
        ` and is on its way to Lusaka. We will message you the day it lands.` +
        sign
      );

    case "ARRIVED_DAR":
      return (
        `Hello ${name}, your cargo ${tracking} has arrived in Lusaka. ` +
        `We are checking it in against the manifest and will send your invoice shortly.\n` +
        `📦 Your ${STORAGE_POLICY.freeDays} free storage days start today. ` +
        `After that it is USD ${STORAGE_POLICY.perDayUsd} per day.` +
        sign
      );

    case "INVOICE_ISSUED":
      // The cargo has landed and is being held for payment. Both money
      // messages open on that, because it is the fact the customer cares
      // about — "we are reminding you" reads as a complaint about them.
      return moneyMessage(context, ARRIVED_AND_HELD);

    case "PAYMENT_REMINDER":
      return moneyMessage(
        context,
        "This is a reminder that payment for your cargo is still outstanding:"
      );

    case "READY_FOR_PICKUP":
      return (
        `Hello ${name}, payment is complete and your cargo ${tracking} is ready ` +
        `for collection at ${COMPANY.offices[0].address}.\n` +
        `Bring this tracking number with you.\n` +
        `The first ${STORAGE_POLICY.freeDays} storage days are free.` +
        sign
      );

    case "STORAGE_REMINDER": {
      /* `storageDays` is the CHARGEABLE count — days past the free week, not
         days held. Quoting it as "has been here N days" understated the stay
         by a whole week and made a charging consignment read as still free. */
      const over = context.storageDays ?? 0;
      const held = STORAGE_POLICY.freeDays + over;
      const fee = over * STORAGE_POLICY.perDayUsd;
      return (
        `Hello ${name}, your cargo ${tracking} has now been in our warehouse ` +
        `${held} days — ${over} day${over === 1 ? "" : "s"} past your ` +
        `${STORAGE_POLICY.freeDays} free days.\n` +
        `💰 Storage so far: *USD ${fee.toFixed(2)}* ` +
        `(USD ${STORAGE_POLICY.perDayUsd} per day, and still growing).\n` +
        `Please collect your cargo soon to stop the charge.` +
        sign
      );
    }

    case "GENERAL":
    default:
      return `Hello ${name},` + sign;
  }
}

/** Which message the shipment's own state calls for. */
export function suggestedKind(input: {
  status: string;
  hasInvoice: boolean;
  outstanding: number;
  storageDays: number;
}): MessageKind {
  if (input.status === "READY_FOR_PICKUP") {
    return input.storageDays > 0 ? "STORAGE_REMINDER" : "READY_FOR_PICKUP";
  }
  if (input.status === "RECEIVED_AT_ZAMBIA") {
    if (!input.hasInvoice) return "ARRIVED_DAR";
    return input.outstanding > 0 ? "PAYMENT_REMINDER" : "READY_FOR_PICKUP";
  }
  if (input.status === "IN_TRANSIT") return "IN_TRANSIT";
  if (input.status === "READY_TO_DEPART") return "SHIPMENT_REGISTERED";
  return "GENERAL";
}

/** A wa.me link that opens WhatsApp with the message already typed. */
/**
 * How a customer is told to pay. One block, every surface, every method.
 *
 * Three lines each — what to open, the number, the name they must see before
 * confirming — because that is how somebody checks a number on a phone: one
 * glance per line, not a sentence to parse.
 *
 * Nothing is shortened. "Airtel Money: 7122055" makes a customer guess whether that is
 * a Lipa number, a personal number or an account, and a guess here is money
 * sent somewhere it cannot be recovered from. The labels carry the service, the
 * kind of number, and the currency for banks.
 *
 * Read straight from PAYMENT_METHODS, so a number changed there changes here,
 * on the invoice, in the PDF and on the public site at the same moment.
 */
function paymentBlock(bold: (text: string) => string) {
  return PAYMENT_METHODS.flatMap((method) => [
    bold(method.label),
    method.number,
    bold(method.accountName),
    ``,
  ]);
}

/**
 * Where to find us, laid out so somebody could actually go there.
 *
 * One line per address put the street, the landmark and the city in a single
 * run that WhatsApp wrapped wherever it ran out of room — usually mid-street.
 * An address is scanned in the shape it is written on an envelope, so it is
 * written that way.
 *
 * The breaks come from configuration rather than from splitting the one-line
 * version on commas: guessing where an address divides gets it wrong for the
 * next office added.
 */
function officeBlock(bold: (text: string) => string) {
  const zambia = COMPANY.offices[0];
  const china = COMPANY.chinaOffice;
  return [
    `📍 ${bold("OUR OFFICES")}`,
    ``,
    `${zambia.flag} ${bold(`${zambia.city.toUpperCase()} — ${zambia.country}`)}`,
    ...zambia.lines,
    ``,
    `${china.flag} ${bold(`${china.city.toUpperCase()} — ${china.country}`)}`,
    ...china.lines,
    ``,
  ];
}

/**
 * The reminder the follow-up queue sends.
 *
 * Deliberately the SAME message the invoice composer drafts. There is one way
 * this business asks to be paid, and two builders producing two versions of it
 * is how a customer gets one set of accounts on Monday and another on Friday.
 */
export function paymentReminder(input: {
  customerName: string;
  trackingNumber: string;
  description: string;
  invoiceNumber: string | null;
  weightKg?: number | null;
  freightBasis?: string | null;
  /** The invoice's own rate. Never today's. */
  exchangeRate?: number | null;
  amountUsd?: number | null;
  amountLocal?: number | null;
  localCurrency?: string | null;
}) {
  return moneyMessage(
    {
      customerName: input.customerName,
      trackingNumber: input.trackingNumber,
      description: input.description,
      invoiceNumber: input.invoiceNumber,
      weightKg: input.weightKg,
      freightBasis: input.freightBasis,
      exchangeRate: input.exchangeRate,
      amountUsd: input.amountUsd,
      amountLocal: input.amountLocal,
      localCurrency: input.localCurrency,
    },
    ARRIVED_AND_HELD
  );
}

/**
 * Zambia's country code, for turning a locally-written number into one wa.me
 * will accept.
 *
 * This was 255 — Tanzania — carried over with the rest of the Target Express
 * code, and it is the kind of mistake that does not announce itself: every
 * WhatsApp link built from a customer's 09… number would have opened a chat
 * with a Tanzanian number that either does not exist or belongs to a stranger,
 * and the desk would only find out when nobody replied.
 */
const ZM_COUNTRY_CODE = "260";

export function whatsappLink(phone: string | null, body: string) {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  /* 097… is how a number is written in Zambia; wa.me wants 26097…. A number
     that already carries the code, or any other country's, is left alone —
     several AITRANSIT customers and every supplier are on +86. */
  const target = digits.startsWith("0")
    ? `${ZM_COUNTRY_CODE}${digits.slice(1)}`
    : digits;
  return `https://wa.me/${target}?text=${encodeURIComponent(body)}`;
}
