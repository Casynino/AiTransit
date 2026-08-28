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
 *
 * A `.n` suffix is for a second revision on the same day, which happens while a
 * document is being drafted and must not be papered over: two different sets of
 * obligations cannot share one version string, or an acceptance stops
 * identifying what was accepted.
 */
export const TERMS_VERSION = "2026-08-28.2";

/**
 * Superseded versions, kept so an old acceptance still resolves to something.
 *
 * The note says what CHANGED, not what the version was called. When somebody
 * asks in two years why a customer who accepted an old version is being held to
 * a clause, this list is the answer.
 */
export const TERMS_HISTORY: { version: string; note: string }[] = [
  {
    version: "2026-08-28",
    note:
      "First published. Superseded the same day by 2026-08-28.2, which tightened " +
      "three things: supplier payment instructions became final once confirmed and " +
      "the risk of wrong account details was stated explicitly; the exchange rate " +
      "became fixed once confirmed and funded, in both directions; and inspection " +
      "was spelled out as a visual check with a list of what it is not.",
  },
];

/**
 * Awaiting legal review.
 *
 * TRUE puts a visible notice at the top of the terms page and in the acceptance
 * box. It does NOT weaken the acceptance — a customer still has to tick and the
 * tick is still recorded, because trading with no terms at all is worse than
 * trading with terms a lawyer has not yet blessed.
 */
export const TERMS_DRAFT = true;

/**
 * THE LIABILITY CAP — the one figure in this document I cannot give you.
 *
 * The Montreal Convention caps a carrier's liability for cargo at a number of
 * SDR per kilogram. SDR is the IMF's unit of account, not a currency: it floats
 * against the dollar daily, which is exactly why the Convention is written in
 * it and why this is not stored as a USD figure.
 *
 * The number is revised on a five-yearly cycle and has moved more than once.
 * Writing a figure into a customer-facing document from memory is how a company
 * ends up publishing a cap it cannot rely on — and a limitation clause that is
 * wrong is not merely weakened, it is struck out, leaving no cap at all.
 *
 * SO: ASK YOUR LAWYER THESE THREE QUESTIONS.
 *
 *   1. What is the Montreal Convention cargo limit in SDR per kilogram TODAY?
 *   2. Does Zambia apply it, and does China, on this route?
 *   3. Should our own limit as a forwarder match it, or sit below it under
 *      standard trading conditions?
 *
 * Then set `sdrPerKg` and `confirmedOn` below. Until you do, the clause states
 * that the Convention limit applies without pretending to know the figure, and
 * tells the customer to ask us for it — which is true, and is a great deal
 * safer than a number nobody checked.
 */
export const LIABILITY_CAP: {
  /** SDR per kilogram, from the Convention. Null until a lawyer confirms it. */
  sdrPerKg: number | null;
  /** When it was confirmed, so the next reviewer knows how stale it is. */
  confirmedOn: string | null;
} = {
  sdrPerKg: null,
  confirmedOn: null,
};

const capSentence = LIABILITY_CAP.sdrPerKg
  ? `The Convention caps compensation at ${LIABILITY_CAP.sdrPerKg} SDR per kilogram of the goods lost or damaged. SDR is the International Monetary Fund's unit of account and its value against the dollar changes daily; we will tell you the figure that applies on the day you ask.`
  : "The Convention caps compensation at a fixed number of SDR — the International Monetary Fund's unit of account — per kilogram of the goods lost or damaged. Ask us for the figure that applies to your consignment and we will give it to you before you ship.";

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
          "Because the goods travel by air, the carrier's liability for the air leg is limited by the Montreal Convention.",
          capSentence,
          "That limit applies however much your goods actually cost you, unless you declared a higher value and paid the supplementary charge before we shipped them. Our liability to you for the air leg is limited to what we recover, or would be entitled to recover, from the carrier.",
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
          "Where you ask us to pay a supplier in China, we do so as your agent and on your instruction. We are not a party to your contract with that supplier, we do not guarantee that they will deliver, and we do not guarantee the goods.",
          "A request is not accepted until we have confirmed the amount, the rate and our fee with you. We may decline any request without giving a reason, and we may ask for documents about the underlying trade before we act.",
        ],
      },
      {
        heading: "Payment details are yours to get right",
        body: [
          "You give us the supplier's name, bank or wallet, account number and any reference. We pay exactly what you gave us. We do not verify that the account belongs to the supplier you named, and we cannot — a Chinese bank will not confirm an account holder to a third party.",
          "Check the details before you confirm. Once you have confirmed a payment we treat your instruction as final:",
        ],
        list: [
          "We will not change the recipient, the amount or the currency after you have confirmed, except where we have not yet sent the money and are able to stop it.",
          "A transfer that has left us cannot be recalled by us. Recovering money sent to the wrong account is a matter between you, the receiving bank and the account holder, and it usually fails.",
          "If the details you gave us were wrong, the loss is yours. That is true even where the mistake was your supplier's — a changed account number in an email or a message is the commonest fraud on this route, and we have no way to detect it.",
          "Where we have already sent the money, our fee remains payable.",
        ],
      },
      {
        heading: "If you think the details have been tampered with",
        body: [
          "Telephone us. Do not reply to the message. If a supplier's account details change part-way through an order, treat it as fraud until you have confirmed the new details with somebody you can hear on a call. We will hold a payment while you check, and we would far rather do that than send it.",
        ],
      },
      {
        heading: "Currency exchange",
        body: [
          "Rates we publish on our board or in our calculator are indicative and are not an offer. A rate becomes binding only when our money desk confirms your booking with you, and it holds for the period we state at that time.",
          "Once a rate is confirmed and your funds have reached us, the exchange is fixed at that rate. Currency moves in both directions and we carry the risk from the moment we confirm — so a rate cannot be reopened afterwards because the market has moved in your favour, and we will not ask you for more if it has moved in ours.",
          "If your funds do not reach us within the period we stated, the rate lapses and we will requote. You may cancel a booking at any time before your funds reach us. After that we can only cancel if we have not yet bought the currency, and any cost of unwinding it is yours.",
        ],
      },
      {
        heading: "Inspection is a visual check, and only that",
        body: [
          "Where we inspect goods for you, we open the cartons, look at what is inside, compare it with the description you gave us, and photograph what we find. We are telling you what we could see on the day. That is the whole of the service.",
          "An inspection is NOT:",
        ],
        list: [
          "A test of quality, durability or workmanship. We do not use the goods, power them on, or take them apart.",
          "A check against a specification, a sample or a technical standard, unless we have agreed one with you in writing beforehand and charged for it.",
          "A count of every unit. Unless we agree otherwise, we check cartons and a sample of what is in them — a full unit count on a large consignment is a separate job and we will quote for it.",
          "A check that the goods are genuine, licensed or safe to import.",
          "An approval of the goods, or advice to pay your supplier. Deciding whether to accept what we photographed is yours.",
        ],
      },
      {
        heading: "What our photographs mean",
        body: [
          "Our photographs record the condition the goods were in when they reached our China warehouse. They are the best evidence either of us will have if something is disputed later, which is why we take them on every consignment.",
          "They are not a warranty. Goods that pass through inspection and then turn out to be the wrong colour, the wrong size or of poor quality remain a matter between you and your supplier — inspecting them does not make us the seller, and it does not move the risk of a bad purchase onto us.",
        ],
      },
      {
        heading: "Packing",
        body: [
          "Where we repack goods, we do so to help them survive the flight. Repacking does not make us responsible for the condition the goods were in when your supplier delivered them, and it is not an inspection unless you asked for one.",
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
