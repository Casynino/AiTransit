import "server-only";

import { jsPDF } from "jspdf";

import { BRAND_LOGO_PNG, BRAND_LOGO_RATIO } from "@/lib/brand-logo-png";
import {
  COMPANY,
  PAYMENT_METHODS,
  STORAGE_POLICY,
  formatPackages,
  storageNotice,
  type CollectionAccount,
} from "@/lib/constants";

/**
 * The invoice as a file a customer can be sent.
 *
 * Drawn rather than screenshotted. The alternative was to render the existing
 * print-styled page through headless Chrome, which means shipping a browser to
 * production to lay out a page of text — a heavy, slow dependency for a
 * document that is a header, a table and a list of bank accounts.
 *
 * This is the only AITRANSIT document most customers ever see. It went out
 * for months as unstyled Helvetica with no logo on it, which is a strange thing
 * for a company that has one: the bill is the last thing a customer reads
 * before they decide whether to trust where they are sending money. So it now
 * carries the mark, the brand rule, a watermark and a status stamp, and the
 * figure a Zambian customer actually pays leads in kwacha with the dollar
 * beneath it as the reference.
 *
 * Everything here is passed in already formatted. This module does no
 * arithmetic and reads no database: an invoice is a statement of figures that
 * were agreed at a point in time, and a document that re-derives them can
 * disagree with the record it claims to represent.
 */

export type InvoicePdfInput = {
  invoiceNumber: string;
  issuedOn: string;
  dueOn: string | null;
  status: string;

  customerName: string;
  customerPhone: string | null;
  customerCity: string | null;

  trackingNumber: string;
  batchNumber: string | null;
  description: string;
  weightKg: number;
  packages: number;
  packageType: string;
  /** "Guangzhou → Lusaka". Optional: older callers do not pass it. */
  routeLabel?: string | null;
  /** The cargo class this was rated as, in the customer's words. */
  cargoLabel?: string | null;

  currency: string;
  freight: number;
  storage: number;
  storageDays: number;
  /**
   * Calculated then forgiven — stated on the bill, nil in the Amount column.
   *
   * It printed as a negative line item against a total that never included the
   * charge (waiveStorageFee drops it rather than deducting it), so the charges
   * on the customer's copy came to less than the amount due.
   */
  storageWaived?: number;
  otherCharges: number;
  discount: number;
  total: number;
  paid: number;
  outstanding: number;

  exchangeRate: number | null;
  localCurrency: string;
  totalLocal: number | null;

  /**
   * The accounts this invoice was issued with — see accountsForInvoice.
   *
   * The comment here used to claim the snapshot was read and the code printed
   * the constants regardless, so an invoice raised last year reprinted today's
   * account numbers. A customer paying into a closed account off a document we
   * gave them is our mistake, not theirs.
   */
  accounts?: CollectionAccount[];
};

// ---------------------------------------------------------------------------
// Page furniture
// ---------------------------------------------------------------------------

const PAGE_W = 595.28; // A4 at 72dpi
const PAGE_H = 841.89;
const MARGIN = 44;
const RIGHT = PAGE_W - MARGIN;
const CONTENT = RIGHT - MARGIN;
const FOOT_TOP = PAGE_H - 62; // nothing in the body may cross this

const NAVY: [number, number, number] = [24, 42, 72];
const RED: [number, number, number] = [216, 30, 42];
const INK: [number, number, number] = [18, 20, 26];
const MUTED: [number, number, number] = [112, 118, 130];
const HAIR: [number, number, number] = [214, 217, 224];
const TINT: [number, number, number] = [246, 247, 250];
const GREEN: [number, number, number] = [17, 116, 71];
const AMBER: [number, number, number] = [168, 106, 8];

/**
 * Fold text onto the character set the built-in fonts actually have.
 *
 * jsPDF's Helvetica is WinAnsi. Anything outside it does not fall back — it
 * renders as a stray quote mark with the rest of the line letter-spaced, which
 * is how "Guangzhou → Lusaka" reached a customer as garbage. Em dashes
 * and middots are in WinAnsi and survive; arrows and the typographic minus are
 * not, so they are replaced rather than dropped.
 */
function winAnsi(value: string) {
  return value
    .replace(/[→⟶]/g, "—") // → becomes an em dash
    .replace(/[−–]/g, "-") // minus and en dash become a hyphen
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x00-ÿ–—€]/g, "");
}

function money(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Kwacha are never quoted to the cent — nobody pays 47,385.26 ZMW. */
function local(amount: number, currency: string) {
  return `${currency} ${Math.round(amount).toLocaleString("en-US")}`;
}

export function renderInvoicePdf(input: InvoicePdfInput): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const accounts =
    input.accounts && input.accounts.length > 0
      ? input.accounts
      : PAYMENT_METHODS.map((a) => ({ ...a }));

  const paidInFull = input.outstanding <= 0.005;
  const partPaid = !paidInFull && input.paid > 0;
  const stamp = paidInFull ? "PAID" : partPaid ? "PART PAID" : "UNPAID";
  const stampColour = paidInFull ? GREEN : partPaid ? AMBER : RED;

  // -- primitives ----------------------------------------------------------
  const setInk = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);

  function put(
    value: string,
    x: number,
    y: number,
    {
      size = 9.5,
      style = "normal" as "normal" | "bold" | "italic",
      align = "left" as "left" | "right" | "center",
      colour = INK,
    } = {}
  ) {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    setInk(colour);
    doc.text(winAnsi(value), x, y, { align });
  }

  /** A small uppercase field name. Every block on the page is titled this way. */
  function label(value: string, x: number, y: number, colour = MUTED) {
    doc.setFontSize(6.8);
    doc.setFont("helvetica", "bold");
    setInk(colour);
    doc.text(winAnsi(value.toUpperCase()), x, y, { charSpace: 0.9 });
  }

  function rule(y: number, from = MARGIN, to = RIGHT, colour = HAIR, width = 0.6) {
    doc.setDrawColor(colour[0], colour[1], colour[2]);
    doc.setLineWidth(width);
    doc.line(from, y, to, y);
  }

  /**
   * Chrome that belongs to the sheet rather than the content: the brand rule at
   * the top, the watermark, and the footer. Redrawn on every page, because a
   * second page with no mark on it is a second page nobody can attribute.
   */
  function furniture(page: number) {
    setFill(NAVY);
    doc.rect(0, 0, PAGE_W, 6, "F");
    setFill(RED);
    doc.rect(0, 0, 148, 6, "F");

    // The mark, ghosted, behind everything. Faint enough that the small print
    // over it stays small print — a watermark that fights the terms is worse
    // than no watermark.
    const wmW = 300;
    doc.saveGraphicsState();
    // @ts-expect-error -- GState is attached to the jsPDF instance at runtime.
    doc.setGState(new doc.GState({ opacity: 0.045 }));
    doc.addImage(
      BRAND_LOGO_PNG,
      "PNG",
      (PAGE_W - wmW) / 2,
      PAGE_H / 2 - wmW / BRAND_LOGO_RATIO / 2,
      wmW,
      wmW / BRAND_LOGO_RATIO
    );
    doc.restoreGraphicsState();

    rule(FOOT_TOP + 16);
    put(COMPANY.name, MARGIN, FOOT_TOP + 30, { size: 8, style: "bold", colour: NAVY });
    put("SHIP WITH YOUR OWN, PROUDLY ZAMBIAN", MARGIN, FOOT_TOP + 40, {
      size: 7,
      style: "bold",
      colour: RED,
    });
    put(`${COMPANY.phone}  ·  ${COMPANY.email}`, RIGHT, FOOT_TOP + 30, {
      size: 7.5,
      align: "right",
      colour: MUTED,
    });
    put(`${input.invoiceNumber}  ·  page ${page}`, RIGHT, FOOT_TOP + 40, {
      size: 7.5,
      align: "right",
      colour: MUTED,
    });
  }

  let page = 1;
  let y = 0;

  function newPage() {
    doc.addPage();
    page += 1;
    furniture(page);
    y = MARGIN + 18;
    put(`${input.invoiceNumber} — continued`, MARGIN, y, {
      size: 8,
      style: "bold",
      colour: MUTED,
    });
    y += 20;
  }

  /** Reserve vertical space, breaking the page rather than running off it. */
  function need(height: number) {
    if (y + height > FOOT_TOP) newPage();
  }

  /**
   * The terms, and the file.
   *
   * A settled invoice and an open one leave by different doors — one prints the
   * accounts, the other deliberately does not — and both have to end with the
   * same small print. Sharing one exit is what stops that from being true only
   * on the branch somebody happened to test.
   */
  function finish(): Uint8Array {
    need(96);
    label("Warehouse storage policy", MARGIN, y, RED);
    y += 13;

    /*
      In red. One language now — AITRANSIT bills into Lusaka in English; see
      the note on storageNotice() in lib/constants.ts.

      It was four grey lines of small print under a grey heading, in the same
      ink as the bank details above it — which is exactly how a customer
      arrives on day nine surprised by a charge. The policy is the one part of
      this document that costs somebody money if it goes unread, so it is the
      one part that is not grey.
    */
    /* The notice's OWN heading is deliberately not printed. It duplicated the
       section label above word for word — invisible while there were two
       language blocks under one label, and a heading stacked on itself the
       moment there was one. The label is the heading. */
    const notice = storageNotice();
    const body = doc.splitTextToSize(winAnsi(notice.en.body), CONTENT);
    need(body.length * 9 + 16);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setInk(RED);
    doc.text(body, MARGIN, y);
    y += body.length * 9 + 8;

    // The figure moves, and saying so is the reason to collect early. On a
    // settled invoice it is no longer true, and a warning that cannot come
    // true is how a document teaches people to skip its small print.
    if (!paidInFull) {
      const note = doc.splitTextToSize(
        "This amount can change: storage is charged daily once the free window closes, and the kwacha figure follows the exchange rate on the day of payment.",
        CONTENT
      );
      need(note.length * 10);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      setInk(MUTED);
      doc.text(note, MARGIN, y);
    }

    return new Uint8Array(doc.output("arraybuffer"));
  }

  furniture(page);

  // --- Header -------------------------------------------------------------
  const logoW = 152;
  doc.addImage(BRAND_LOGO_PNG, "PNG", MARGIN, 30, logoW, logoW / BRAND_LOGO_RATIO);

  put("INVOICE", RIGHT, 52, { size: 22, style: "bold", align: "right", colour: NAVY });
  put(input.invoiceNumber, RIGHT, 70, {
    size: 12,
    style: "bold",
    align: "right",
    colour: INK,
  });
  put(`Issued ${input.issuedOn}`, RIGHT, 84, {
    size: 8,
    align: "right",
    colour: MUTED,
  });
  if (input.dueOn) {
    put(`Due ${input.dueOn}`, RIGHT, 95, { size: 8, align: "right", colour: MUTED });
  }

  // The stamp. A person sorting a pile of these should not have to read the
  // arithmetic to know which ones are settled.
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const stampW = doc.getTextWidth(stamp) + 26;
  doc.setDrawColor(stampColour[0], stampColour[1], stampColour[2]);
  doc.setLineWidth(1.2);
  doc.roundedRect(RIGHT - stampW, 102, stampW, 19, 3, 3, "S");
  put(stamp, RIGHT - stampW / 2, 115, {
    size: 9,
    style: "bold",
    align: "center",
    colour: stampColour,
  });

  y = 138;
  rule(y, MARGIN, RIGHT, NAVY, 1.4);
  y += 24;

  // --- Who and what -------------------------------------------------------
  const COL2 = MARGIN + CONTENT / 2 + 10;
  label("Billed to", MARGIN, y);
  label("Cargo", COL2, y);
  y += 14;
  put(input.customerName, MARGIN, y, { size: 11.5, style: "bold" });
  put(input.trackingNumber, COL2, y, { size: 11.5, style: "bold", colour: NAVY });
  y += 13;
  if (input.customerPhone) put(input.customerPhone, MARGIN, y, { size: 9 });
  put(
    input.batchNumber ? `Batch ${input.batchNumber}` : "Not yet batched",
    COL2,
    y,
    { size: 9, colour: MUTED }
  );
  y += 12;
  if (input.customerCity) put(input.customerCity, MARGIN, y, { size: 9, colour: MUTED });
  if (input.routeLabel) put(input.routeLabel, COL2, y, { size: 9, colour: MUTED });
  y += 22;

  // --- Cargo strip --------------------------------------------------------
  const facts: [string, string][] = [
    ["Weight", `${input.weightKg.toFixed(1)} kg`],
    ["Quantity", formatPackages(input.packages, input.packageType as never)],
    ["Cargo", input.cargoLabel ?? "General cargo"],
    ["Storage days", input.storageDays > 0 ? `${input.storageDays} chargeable` : "None"],
  ];
  need(46);
  setFill(TINT);
  doc.roundedRect(MARGIN, y, CONTENT, 40, 4, 4, "F");
  facts.forEach(([k, v], i) => {
    const x = MARGIN + 14 + (CONTENT / 4) * i;
    label(k, x, y + 15);
    put(v, x, y + 29, { size: 9.5, style: "bold" });
  });
  y += 56;

  // Cargo description — the customer's own wording, so it can be any length.
  const description = doc.splitTextToSize(winAnsi(input.description), CONTENT);
  need(20 + description.length * 12);
  label("Goods", MARGIN, y);
  y += 13;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  setInk(INK);
  doc.text(description, MARGIN, y);
  y += description.length * 12 + 18;

  // --- Charges ------------------------------------------------------------
  need(90);
  setFill(NAVY);
  doc.rect(MARGIN, y, CONTENT, 20, "F");
  put("DESCRIPTION", MARGIN + 12, y + 13.5, {
    size: 7,
    style: "bold",
    colour: [255, 255, 255],
  });
  put("AMOUNT", RIGHT - 12, y + 13.5, {
    size: 7,
    style: "bold",
    align: "right",
    colour: [255, 255, 255],
  });
  y += 20;

  const charge = (title: string, note: string | null, amount: number) => {
    const h = note ? 30 : 22;
    need(h);
    put(title, MARGIN + 12, y + 14, { size: 9.5, style: "bold" });
    if (note) put(note, MARGIN + 12, y + 24, { size: 7.5, colour: MUTED });
    put(money(amount, input.currency), RIGHT - 12, y + 14, {
      size: 9.5,
      align: "right",
    });
    y += h;
    rule(y);
  };

  charge(
    "Air freight",
    input.routeLabel ?? "China → Lusaka",
    input.freight
  );
  if (input.storage > 0) {
    charge(
      "Storage",
      `${input.storageDays} day(s) beyond the ${STORAGE_POLICY.freeDays} free days, at ${STORAGE_POLICY.currency} ${STORAGE_POLICY.perDayUsd}/day`,
      input.storage
    );
  }
  /* Forgiven, on the face of the bill — and nil in the Amount column, which has
     to add up to the total printed under it. This drew "-USD 16.00" against a
     total the waiver was never inside, so the charges on the customer's copy of
     the bill came to less than the amount due and they paid the difference
     short. The figure the business gave away is stated in the note; only what is
     owed goes in the column. */
  if ((input.storageWaived ?? 0) > 0) {
    charge(
      "Storage (waived)",
      `${input.storageDays} day(s) accrued — ${money(input.storageWaived ?? 0, input.currency)} waived, not charged`,
      0
    );
  }
  if (input.otherCharges > 0) charge("Additional charges", null, input.otherCharges);
  if (input.discount > 0) charge("Discount", null, -input.discount);

  // --- The figure ---------------------------------------------------------
  //
  // Kwacha lead. The invoice is raised in dollars because the rate card is,
  // but the person paying it pays ZMW into a ZMW account, and the number they
  // have to recognise on their phone should be the biggest thing on the page.
  const panelH = 74;
  need(panelH + 16);
  y += 12;
  const panelW = 250;
  const panelX = RIGHT - panelW;

  // Left of the panel: how the figure was reached.
  let ly = y + 14;
  const sub = (k: string, v: string) => {
    put(k, MARGIN, ly, { size: 8.5, colour: MUTED });
    put(v, panelX - 16, ly, { size: 8.5, align: "right" });
    ly += 14;
  };
  sub("Total", money(input.total, input.currency));
  if (input.paid > 0) sub("Received", `-${money(input.paid, input.currency)}`);
  if (input.exchangeRate !== null) {
    sub(
      "Rate on issue",
      `${input.exchangeRate.toLocaleString("en-US")} ${input.localCurrency}/${input.currency}`
    );
  }

  setFill(paidInFull ? GREEN : NAVY);
  doc.roundedRect(panelX, y, panelW, panelH, 5, 5, "F");
  put(paidInFull ? "PAID IN FULL" : "AMOUNT DUE", panelX + 16, y + 19, {
    size: 7,
    style: "bold",
    colour: [255, 255, 255],
  });

  // A settled invoice shows what was paid, not a zero. "ZMW 0" under the word
  // PAID reads as a document that failed to render, and it is the version a
  // customer keeps.
  const headline = paidInFull ? input.total : Math.max(0, input.outstanding);
  const headlineLocal =
    input.exchangeRate === null ? null : headline * input.exchangeRate;

  if (headlineLocal !== null) {
    put(local(headlineLocal, input.localCurrency), panelX + 16, y + 45, {
      size: 21,
      style: "bold",
      colour: [255, 255, 255],
    });
    put(
      `${money(headline, input.currency)}  ${paidInFull ? "received with thanks" : "at the rate on this invoice"}`,
      panelX + 16,
      y + 62,
      { size: 8, colour: [216, 222, 234] }
    );
  } else {
    put(money(headline, input.currency), panelX + 16, y + 45, {
      size: 21,
      style: "bold",
      colour: [255, 255, 255],
    });
    put(
      paidInFull
        ? "Received with thanks"
        : "No exchange rate was locked on this invoice",
      panelX + 16,
      y + 62,
      { size: 8, colour: [216, 222, 234] }
    );
  }
  y += panelH + 24;

  // --- How to pay ---------------------------------------------------------
  //
  // Printed only while there is something to pay. A settled invoice carrying a
  // list of Lipa numbers is an invitation to pay twice, and chasing a duplicate
  // back out of a mobile money account costs a fortnight of somebody's week.
  if (paidInFull) {
    need(46);
    setFill([236, 246, 240]);
    doc.roundedRect(MARGIN, y, CONTENT, 34, 5, 5, "F");
    put("Settled in full — thank you for your business.", MARGIN + 14, y + 21, {
      size: 10,
      style: "bold",
      colour: GREEN,
    });
    put(
      "No payment is outstanding on this invoice.",
      RIGHT - 14,
      y + 21,
      { size: 8, align: "right", colour: MUTED }
    );
    y += 54;
    return finish();
  }

  const mobile = accounts.filter((a) => a.kind === "MOBILE");
  const banks = accounts.filter((a) => a.kind === "BANK");
  const rows = Math.max(mobile.length, banks.length);
  const payH = 40 + rows * 30;
  need(payH + 24);

  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(1);
  doc.roundedRect(MARGIN, y, CONTENT, payH, 5, 5, "S");
  put("HOW TO PAY", MARGIN + 14, y + 20, { size: 10, style: "bold", colour: NAVY });
  put(
    `Quote ${input.trackingNumber} as the reference`,
    RIGHT - 14,
    y + 20,
    { size: 8, align: "right", colour: MUTED }
  );

  const account = (a: CollectionAccount, x: number, top: number) => {
    put(a.label, x, top, { size: 7.5, style: "bold", colour: MUTED });
    put(a.number, x, top + 12, { size: 11, style: "bold", colour: NAVY });
    put(a.accountName, x, top + 21, { size: 7, colour: MUTED });
  };

  const colW = (CONTENT - 28) / 2;
  mobile.forEach((a, i) => account(a, MARGIN + 14, y + 44 + i * 30));
  banks.forEach((a, i) => account(a, MARGIN + 14 + colW + 4, y + 44 + i * 30));
  y += payH + 20;

  return finish();
}
