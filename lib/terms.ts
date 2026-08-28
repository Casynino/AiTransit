import { COMPANY, STORAGE_POLICY } from "@/lib/constants";

/**
 * AITRANSIT's terms of business, and the version somebody agreed to.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * READ THIS BEFORE YOU CHANGE ANYTHING IN THIS FILE.
 *
 * These are the terms customers are held to. They are drafted from what this
 * system actually does — the storage clock in STORAGE_POLICY, the currency
 * every invoice is raised in, the release rules the counter enforces — so the
 * document and the software agree. That is the part software can get right.
 *
 * What software CANNOT get right is whether a liability cap is enforceable in
 * Zambia, whether the money-exchange service needs a Bank of Zambia licence, or
 * whether the lien clause below survives a challenge. Those are questions for a
 * Zambian commercial lawyer, and an unreasonable limitation clause is not
 * merely weakened when it fails — it is struck out, leaving NO limit at all.
 *
 * `DRAFT` below is what stops these going live unreviewed. While it is true the
 * page carries a visible notice saying the terms are awaiting legal review.
 * Turn it off when a lawyer has signed the document off, and not before.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * VERSIONING IS THE POINT OF THIS FILE.
 *
 * "The customer agreed to the terms" is worth nothing without "which terms".
 * Every acceptance stores `TERMS_VERSION`, so a dispute in two years can be
 * answered with the document as it stood on the day. That means:
 *
 *   Change a word that changes an obligation  →  bump TERMS_VERSION.
 *   Fix a typo that changes nothing           →  leave it alone.
 *
 * Bumping the version makes every existing customer re-accept before they can
 * use the portal again — see requireAcceptedTerms in lib/portal.ts. That is
 * deliberate friction and it is the whole mechanism. Do not bump it casually,
 * and never edit an old version's text: keep the superseded wording in
 * TERMS_HISTORY so an old acceptance still points at something readable.
 */

/**
 * Bump when an obligation changes. Dated, not numbered, because the first
 * question anybody asks about a version is "from when".
 */
export const TERMS_VERSION = "2026-08-28";

/** Superseded versions, kept so an old acceptance still resolves to a document. */
export const TERMS_HISTORY: { version: string; note: string }[] = [];

/**
 * Awaiting legal review.
 *
 * TRUE puts a visible notice at the top of the terms page and in the acceptance
 * box. It does NOT weaken the acceptance — a customer still has to tick and the
 * tick is still recorded, because trading with no terms at all is worse than
 * trading with terms a lawyer has not yet blessed.
 */
export const TERMS_DRAFT = true;

export type Clause = { heading?: string; body: string[]; list?: string[] };
export type Section = { id: string; title: string; clauses: Clause[] };

const S = STORAGE_POLICY;

export const TERMS_SECTIONS: Section[] = [
  {
    id: "who-we-are",
    title: "1. Who we are, and what we are doing for you",
    clauses: [
      {
        body: [
          `${COMPANY.name} ("AITRANSIT", "we", "us") arranges the carriage of goods by air from our warehouses in China to our warehouse in Lusaka, Zambia, and provides the related services described in these terms. "You" means the customer whose goods we carry or on whose instructions we act.`,
          "We act as a freight forwarder and consolidator. We are not an airline and we do not operate aircraft. We contract with airlines and other carriers on your behalf and in our own name, and your goods are carried under the carrier's own conditions of carriage and the international conventions that apply to them.",
          "We consolidate goods belonging to different customers into a single shipment. By using our service you agree to your goods being carried alongside other customers' goods.",
        ],
      },
      {
        heading: "These terms apply to everything we do for you",
        body: [
          "These terms apply to every consignment we handle for you and to every service we provide, whether you booked it on our website, in our portal, at one of our counters, or over the telephone or WhatsApp. They apply in place of anything said in conversation.",
          "We may change these terms. The current version is always published on this page with the date it took effect. If we change anything that affects your obligations we will ask you to agree to the new version before you use your account again.",
        ],
      },
    ],
  },
  {
    id: "your-goods",
    title: "2. What you promise about your goods",
    clauses: [
      {
        body: [
          "You confirm, for every consignment you send with us, that:",
        ],
        list: [
          "You own the goods, or you are authorised by the owner to send them.",
          "The description, quantity, weight and value you give us are true and complete.",
          "The goods are packed well enough to survive air carriage and handling.",
          "The goods are not prohibited or restricted, as set out below.",
          "The goods do not infringe anybody's trademark, copyright or other rights.",
        ],
      },
      {
        heading: "Goods we will not carry",
        body: [
          "We do not carry, and you must not send us:",
        ],
        list: [
          "Weapons, ammunition, explosives or their parts.",
          "Narcotics and controlled substances.",
          "Currency, bullion, bearer instruments or precious stones.",
          "Flammable liquids and gases, aerosols, corrosives and other dangerous goods, except where we have agreed in writing in advance and the goods are declared and packed to IATA requirements.",
          "Lithium batteries outside the limits the airline allows, whether loose or inside equipment.",
          "Ivory, wildlife products and anything protected under CITES.",
          "Counterfeit goods.",
          "Human remains, live animals and perishable foodstuffs.",
          "Anything prohibited by Chinese export law, Zambian import law, or the airline.",
        ],
      },
      {
        heading: "We may open and check your cargo",
        body: [
          "We may open, inspect, weigh, X-ray and photograph any consignment at any time, and we must do so if an airline, a customs authority or the law requires it. We photograph cargo as a matter of routine at our China warehouse and again on arrival in Lusaka; those photographs are the record of the condition your goods were in.",
        ],
      },
      {
        heading: "If a declaration is wrong",
        body: [
          "You are responsible for what you declare. If a declaration is false or incomplete you indemnify us against every fine, penalty, duty, tax, storage charge, legal cost and loss that results — including losses suffered by other customers whose goods are delayed, seized or destroyed because of yours.",
          "We may refuse, hold, return or dispose of any consignment that breaches this section, and you remain liable for the charges already incurred on it.",
        ],
      },
    ],
  },
  {
    id: "price",
    title: "3. Prices, weight and what is included",
    clauses: [
      {
        heading: "How we price",
        body: [
          "Freight is charged either per kilogram at the rate published for the cargo category, or per item for the goods we price per piece. The rate that applies to your consignment is the rate published at the time your invoice is confirmed.",
          "Chargeable weight is the greater of actual weight and volumetric weight. Where a consignment is priced per item, the item count governs.",
        ],
      },
      {
        heading: "The Lusaka weight is the weight we charge",
        body: [
          "We weigh your cargo when we receive it in China and again when we check it in at Lusaka. The Lusaka weight is the one your invoice is calculated on. A weight given to you by your supplier is not binding on us.",
        ],
      },
      {
        heading: "What the price includes",
        body: [
          "Unless we tell you otherwise in writing, our published rate includes air freight and import duty to our Lusaka warehouse. It does not include: storage beyond the free period; onward delivery from our warehouse; charges arising from a false declaration; charges for goods held or inspected by customs beyond routine clearance; or any service we agree separately with you.",
        ],
      },
      {
        heading: "Quotations",
        body: [
          "A price we quote before your cargo is weighed at Lusaka is an estimate. The binding figure is the invoice we confirm.",
          "We may change our published rates at any time. A rate change never affects an invoice we have already confirmed: a confirmed invoice keeps the rate it was raised at.",
        ],
      },
      {
        heading: "Currency",
        body: [
          "We invoice in United States dollars. Where we show a kwacha figure on an invoice it is a conversion at the rate recorded on that invoice on the day it was confirmed, and that rate does not change afterwards. Rates shown on our exchange board or calculator are indicative and are not the rate on your invoice.",
        ],
      },
    ],
  },
  {
    id: "storage",
    title: "4. Storage",
    clauses: [
      {
        body: [
          `Storage at our Lusaka warehouse is free for ${S.freeDays} days. The ${S.freeDays} days start on the day we check your cargo in at Lusaka — not the day the aircraft lands — and stop on the day you collect.`,
          `After the free period we charge ${S.currency} ${S.perDayUsd} per day per consignment, and the charge is added to your invoice.`,
        ],
      },
      {
        heading: "Cargo nobody collects",
        body: [
          "If a consignment is still with us 90 days after we checked it in, and we have tried to reach you on the contact details on your account, we may sell or otherwise dispose of it and apply the proceeds to what you owe us. Anything left over after our charges and the costs of sale is yours; anything still owing remains payable.",
          "We will not do this to cargo that is the subject of an open claim or an unresolved investigation.",
        ],
      },
    ],
  },
  {
    id: "payment",
    title: "5. Payment, credit and our lien",
    clauses: [
      {
        heading: "Payment is due before collection",
        body: [
          "Unless we have approved credit for you, your invoice must be paid in full before we release your cargo.",
          "Only our finance desk can confirm a payment. Sending us a screenshot, a reference or proof of transfer tells us that you have paid; it does not settle the invoice. Your balance changes when we have matched the money to the account it arrived in.",
          "Pay only into the accounts printed on your invoice. We are not responsible for money sent anywhere else.",
        ],
      },
      {
        heading: "Credit",
        body: [
          "We may agree a credit limit and payment term with you. Credit is a facility, not a right: we may reduce or withdraw it at any time, and we may refuse to release cargo on credit where doing so would take you past your limit or where an earlier invoice is overdue.",
          "Where credit is approved, payment is due by the date on the invoice.",
        ],
      },
      {
        heading: "Our lien",
        body: [
          "We have a lien over all goods and documents of yours in our possession, for all sums you owe us on any account — not only sums owing on the goods we are holding. If a debt remains unpaid 30 days after we have given you notice, we may sell the goods and apply the proceeds to what you owe.",
        ],
      },
    ],
  },
  {
    id: "collection",
    title: "6. Collecting your cargo",
    clauses: [
      {
        body: [
          "We release cargo against a valid pickup note, which we issue once your invoice is settled or credit has been approved. The note is scanned at the counter. We will not release cargo against a name, a telephone call, a message or a screenshot that will not scan.",
          "Bring identification. If somebody else is collecting for you, tell us who they are in advance through your portal or by contacting us. Once we have released cargo to a person you nominated, it has been delivered, and what happens to it afterwards is between you and them.",
        ],
      },
      {
        heading: "Check your cargo at the counter",
        body: [
          "Check the number of pieces and the condition of your cargo before you leave. Once you have signed for it, we have delivered it as described. Damage or shortage that you notice at the counter must be raised there and then, so that we can photograph and record it while the cargo is still with us.",
        ],
      },
    ],
  },
  {
    id: "liability",
    title: "7. Loss, damage, delay and claims",
    clauses: [
      {
        heading: "Tell us quickly",
        body: [
          "Damage, shortage or wrong goods must be reported at collection or within 7 days of collection. Non-delivery of a consignment must be reported within 30 days of the date we told you it would arrive.",
          "Claims made after these periods are out of time, because by then the evidence that would settle them — the cargo, the photographs, the airline's records — is gone.",
          "Raise a claim through your portal or at our office. Keep the packaging and the goods as they are until we have seen them.",
        ],
      },
      {
        heading: "What we are responsible for",
        body: [
          "We are responsible for loss of or damage to your goods where it results from our negligence or that of our staff while the goods are in our care.",
          "Because the goods travel by air, the carrier's liability for the air leg is limited by the Montreal Convention, which caps compensation at a fixed amount per kilogram of the goods lost or damaged unless a higher value was declared and a supplementary charge paid at the time of shipment. Our liability to you for that leg is limited to what we recover, or would be entitled to recover, from the carrier.",
        ],
      },
      {
        heading: "Declaring a higher value",
        body: [
          "If your goods are worth more than the per-kilogram limit, tell us before we ship them. We will quote a supplementary charge and record the declared value against the consignment. Without a declared value, the limit applies however much the goods actually cost you.",
          "For most customers the better answer is separate cargo insurance. We can point you to it; we do not sell it, and unless we have agreed otherwise in writing your goods are not insured by us.",
        ],
      },
      {
        heading: "What we are not responsible for",
        body: [
          "We are not liable for:",
        ],
        list: [
          "Loss of profit, loss of sale, loss of market or any other indirect or consequential loss, however it arises.",
          "Delay. Our published transit times are targets, not promises. Flights are cancelled, consolidations are held for space, and customs inspections take as long as they take.",
          "Damage arising from the nature of the goods themselves, or from packing done by you or your supplier.",
          "Seizure, detention, destruction or delay by customs, police or any other authority.",
          "Anything caused by war, civil unrest, strike, epidemic, natural disaster, or any other event outside our reasonable control.",
          "Goods we were not told about, or that were misdeclared.",
        ],
      },
    ],
  },
  {
    id: "china-services",
    title: "8. Our services in China",
    clauses: [
      {
        heading: "Paying your supplier",
        body: [
          "Where you ask us to pay a supplier in China, we do so as your agent and on your instruction. You are responsible for the accuracy of the supplier's name, account and payment details. A transfer sent to details you gave us cannot be recalled, and if those details are wrong the loss is yours.",
          "A payment request is not accepted until we confirm the amount, the rate and our fee with you. We may decline a request without giving a reason, and we may require documents about the underlying trade before we act.",
          "We are paying a supplier on your behalf. We are not a party to your contract with them, we do not guarantee that they will deliver, and we do not guarantee the goods.",
        ],
      },
      {
        heading: "Currency exchange",
        body: [
          "Rates we publish on our board or in our calculator are indicative and are not an offer. A rate becomes binding only when our money desk confirms your booking, and it holds for the period we state at that time.",
          "If your funds do not reach us within that period the rate lapses and we will requote.",
        ],
      },
      {
        heading: "Inspection and packing",
        body: [
          "Where we inspect goods for you, we carry out a visual check of what is in the cartons against the description you gave us, and we photograph what we find. It is not a test of quality, a check of specification, or a warranty that the goods are fit for anything. We are telling you what we can see.",
          "Where we repack goods, we do so to help them survive the flight. Repacking does not make us responsible for the condition the goods were in when your supplier delivered them.",
        ],
      },
      {
        heading: "Market and factory visits, and sourcing",
        body: [
          "Where we take you to a market or a factory, or introduce you to a supplier, we are providing guidance and interpretation. Your contract for the goods is with the supplier, not with us. We do not guarantee any supplier, price, quality or delivery, and any opinion we give about a supplier is honestly held and nothing more.",
        ],
      },
    ],
  },
  {
    id: "account",
    title: "9. Your account and your information",
    clauses: [
      {
        heading: "Keeping your account secure",
        body: [
          "Keep your password to yourself. Anything done from your account is treated as done by you. Tell us at once if you think somebody else has access to it.",
        ],
      },
      {
        heading: "What we do with your information",
        body: [
          "We hold your name, contact details, your cargo records, your invoices and payments, and the requests you make of us, so that we can carry your goods, bill you and answer your questions.",
          "We share what we have to, with: airlines and handling agents; customs authorities and clearing agents in China and Zambia; and the banks and payment providers involved in your payments. We do not sell your information.",
          "We keep your records for as long as we are required to for tax, customs and accounting purposes.",
          "We contact you about your cargo, your invoices and your requests because those are the things you asked us to do. We will not send you marketing unless you ask for it.",
        ],
      },
    ],
  },
  {
    id: "general",
    title: "10. General",
    clauses: [
      {
        body: [
          "These terms are governed by the law of Zambia, and the courts of Zambia have jurisdiction over any dispute arising from them.",
          "If any part of these terms is found to be unenforceable, the rest continues to apply.",
          "You may not transfer your rights under these terms to anybody else without our written agreement.",
          "These terms, together with the invoice and any written agreement we have signed with you, are the whole agreement between us.",
        ],
      },
      {
        heading: "Talking to us",
        body: [
          `If something has gone wrong, tell us before it becomes a dispute. Raise it in your portal, or contact us on ${COMPANY.phone} or at ${COMPANY.email}. Most things are settled by somebody looking at the record.`,
        ],
      },
    ],
  },
];

/** One line for a checkbox, kept here so every acceptance point says the same. */
export const TERMS_CONSENT_LABEL =
  "I have read and agree to the AITRANSIT terms of business";

/** The sentence under it, which is the part that carries the weight. */
export const TERMS_CONSENT_HINT =
  "This covers what we carry, how we price and weigh it, storage, payment and collection, and what happens if something goes wrong.";
