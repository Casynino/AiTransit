# AITRANSIT Cargo

> **Ship with your own, Proudly Zambian!**

Public marketing site, customer portal and internal operations system for air
freight from Guangzhou / Hong Kong to Lusaka — plus supplier payments in China
and money exchange.

Forked from the Target Express Air Cargo system (China → Tanzania) and adapted:
same architecture, same design system, same money spine. See
[Differences from Target Express](#differences-from-target-express).

One shipment is registered once in China and keeps the same identity —
tracking number and QR token — until it is released to the customer in Lusaka.

```
China warehouse  →  batch  →  flight  →  Lusaka check-in  →  payment  →  release
READY_TO_DEPART     IN_TRANSIT    RECEIVED_AT_ZAMBIA   READY_FOR_PICKUP   DELIVERED
```

## Stack

| Layer    | Choice                                        |
| -------- | --------------------------------------------- |
| Framework| Next.js 15 (App Router, Server Actions), React 19 |
| Language | TypeScript (strict)                           |
| Styling  | Tailwind CSS 3 + shadcn/ui primitives          |
| Database | Neon PostgreSQL                                |
| ORM      | Prisma 6                                       |
| Auth     | NextAuth v5 (credentials + bcrypt, JWT session)|
| Hosting  | Vercel                                         |

## Getting started

The app cannot do anything useful without a database — every money action
demands an account and every page reads real rows — so the database comes
first. On a laptop that is one command:

```bash
npm install
./scripts/dev-db.sh start   # local Postgres in ~/.aitransit-pg, no network needed
npm run db:push
npm run db:seed
npm run db:seed:pricing     # the rate book and the product catalogue
npm run dev
```

Postgres does not survive a reboot — run `./scripts/dev-db.sh start` again
after restarting. `./scripts/dev-db.sh reset` drops everything and re-seeds
from scratch, which is the fastest way back to a clean slate mid-testing.

For a hosted database instead, put a Neon connection string in `.env` (see
[Deploying to Vercel + Neon](#deploying-to-vercel--neon)) and skip the
`dev-db.sh` step.

### Signing in

`npm run db:seed` creates one account per role, all on `SEED_ADMIN_PASSWORD`
from `.env`. **Change every one of them before this is used for real.**

| Sign in as | Email | Lands on |
| --- | --- | --- |
| Admin | `admin@aitransit.co.zm` | `/app/dashboard` |
| China Warehouse | `china@aitransit.co.zm` | `/app/dashboard` |
| Zambia Warehouse | `warehouse@aitransit.co.zm` | `/app/dashboard` |
| Finance | `finance@aitransit.co.zm` | `/app/dashboard` |
| Customer Support | `support@aitransit.co.zm` | `/app/support` |
| Customer | `customer@example.com` | `/portal` |

`AUTH_SECRET` is generated with:

```bash
openssl rand -base64 32
```

The seed creates the CEO account from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
plus one account per department, and — only on an empty database — a set of
demo shipments spread across every stage so each dashboard has something to
show. **Change every seeded password after the first sign-in.**

## Deploying to Vercel + Neon

1. Create a Neon project and copy both connection strings.
   `DATABASE_URL` is the **pooled** one (`…-pooler.…`) used at runtime;
   `DIRECT_URL` is the **direct** one used by Prisma for schema changes.
2. Add every variable from `.env.example` to the Vercel project.
3. Push the schema **before** the first deploy — this project does not migrate
   automatically on deploy, so an unmigrated column breaks production:

   ```bash
   npm run db:push
   ```

4. Deploy. `postinstall` runs `prisma generate` on Vercel automatically.
5. Run `npm run db:seed` once against production to create the CEO account.

Cargo photo uploads use Vercel Blob. Add `BLOB_READ_WRITE_TOKEN` when you enable
a Blob store; without it the app runs fine and simply omits photo uploads.

## Roles

Five staff roles plus the customer, all through one login. The role decides
which building you land in — `/app` for staff, `/portal` for customers — and
the middleware bounces anyone who tries the other one.

| Role               | Can do                                                        |
| ------------------ | ------------------------------------------------------------- |
| `CHINA_WAREHOUSE`  | Register cargo, print labels, build batches, record departure  |
| `ZAMBIA_WAREHOUSE` | Receive batches, check cargo off the manifest, raise exceptions, release cargo |
| `FINANCE`          | Invoice, take payment, issue receipts and pickup notes, run the money desk |
| `CUSTOMER_CARE`    | Answer customers, raise invoices and tickets — never confirms a payment |
| `ADMIN`            | **Everything.** Operations, finance, credit approval, transaction review, reconciliation, batch P&L, reports, users, prices, accounts, settings, audit log |
| `CUSTOMER`         | Their own cargo, invoices and requests in the portal. Holds **no** permissions at all |

**There is no Manager role.** Target Express split oversight between an owner
and a manager; AITRANSIT folds both into `ADMIN`, so `ROLE_PERMISSIONS.ADMIN`
is literally the whole permission list. The old manager screens live on under
`/app/admin` (control centre, operations, batch finances, reconciliation,
approvals, control room, payroll approval, management report).

`CUSTOMER` holding no permissions is the design, not an oversight: the portal
never asks "may they see this?", it asks "is it theirs?" — every query in
`lib/portal.ts` is filtered by the one Customer id the session resolves to.

Permissions are declared in [`lib/rbac.ts`](lib/rbac.ts) as fine-grained
capabilities (`shipment.create`, `pickupNote.issue`, …). Pages and server
actions always ask for a *permission*, never a role, so adding a fifth
department is a table edit rather than a refactor.

Access is checked three times over: in `middleware.ts`, again in the page via
`requirePermission()`, and once more inside every server action via
`authorize()`. The middleware alone is never the gate.

## The QR code

There is exactly one QR per shipment, attached in China and scanned again at
release.

- It encodes a `/t/<qrToken>` URL carrying a 160-bit random token, **not** the
  tracking number. Tracking numbers are sequential and public, so a guessable code must
  never be able to authorise a release.
- `/app/scan` resolves the same code differently per role: China sees the
  registration, Finance sees the money, the Lusaka warehouse sees a plain
  release / do-not-release verdict.
- Releasing cargo requires the pickup note **and** a scan of the carton whose
  token matches it. A mismatch is refused server-side.

Every scanner has a manual code-entry fallback. Warehouse phones lose camera
permission and labels get scuffed; staff must always be able to finish the job.

## Money gates cargo

Cargo cannot be released until Finance has been paid:

1. Finance raises an invoice against the shipment (rate × weight, overridable).
2. Payment is recorded; a numbered receipt is issued in the same transaction.
3. Once the invoice is fully settled **and** the cargo is checked in at Lusaka,
   Finance can issue a pickup note. That is the only thing that moves a
   shipment to `READY_FOR_PICKUP`.
4. The warehouse releases against that note plus a matching cargo scan.

Overpayment is rejected rather than silently creating an unrepresented credit,
and an invoice can no longer be edited once any money has landed on it.

## What the public can see

`lib/tracking.ts` builds the public response by explicit allow-list. Staff
names, internal notes, prices, customer contact details and warehouse
instructions never reach it.

Searching a **batch** number returns batch-level flight status only — never the
list of shipments inside it, which would expose one customer's cargo to anyone
who knows the batch number.

## Printed documents

| Document      | Route                                | Who   |
| ------------- | ------------------------------------ | ----- |
| Cargo label   | `/app/shipments/[id]/label`          | China |
| Batch manifest| `/app/batches/[id]/manifest`         | Both warehouses |
| Pickup note   | `/app/finance/pickup-notes/[id]`     | Finance |

All three print through the browser with a shared print stylesheet — no PDF
service to keep alive. The manifest has a tick column, because it is checked
against physical cartons with a pen.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run db:push    # push schema to the database
npm run db:seed    # seed staff + demo cargo
npm run db:studio  # browse the data
npm run db:seed:pricing   # publish the rate book and the product catalogue
npm run verify:pricing    # check the live rate book against the published card
```

## Notable design decisions

- **Decimal, never Float**, for money and weights. Air freight is billed on
  weight; floating-point drift is not acceptable in a ledger.
- **Document numbers come from a `Counter` table inside the caller's
  transaction**, so two clerks pressing Save at the same moment can never mint
  the same tracking number.
- **Status history and the audit log are append-only.** Nothing mutates them.
- **Weight cannot be edited after departure** — it is what was billed and flown.
- Shipments carry a `CANCELLED` status as an administrative exit. It is not part
  of the five-stage happy path.


## The money desk

AITRANSIT sells two things. Alongside the freight there is currency exchange
and paying suppliers in China, and both run through `/app/finance/exchange`.

**A request is an ask, never a transfer.** The only row a member of the public
can create is an `ExchangeRequest` in status `NEW`. Moving it on is a staff
action gated on `fx.manage`; marking it complete needs `payment.record` **and**
an account, because "completed" means real cash moved and a movement with no
account behind it cannot be reconciled. There is no payment-provider
integration and none is implied — the specification asked for booking, review,
status and record-keeping, and that is exactly what is here.

| Screen                            | What it is                                  |
| --------------------------------- | ------------------------------------------- |
| `/exchange`                       | Public board, calculator, and the two request forms |
| `/app/finance/exchange`           | The desk's inbox, open-first and oldest-first |
| `/app/finance/exchange/[id]`      | One request: what was asked, what was agreed, the two controls |
| `/app/finance/fx-board`           | The rates published on the website           |
| `/app/finance/supplier-payments`  | Money actually paid out, with the account it left |

The published board is **separate** from the USD→ZMW rate invoices are
converted at, which lives on the Pricing screen. One is a shop window meant to
be overwritten every morning; the other is a dated history an invoice freezes
forever. Conflating them would let a marketing rate silently restate last
month's accounts.

## Rates and the 1 kg rule

| Category         | 1–10 kg | 10 kg and above | Route     |
| ---------------- | ------- | --------------- | --------- |
| Normal goods     | $13.50  | $13.00          | Guangzhou |
| Wigs             | $14.40  | $14.00          | Guangzhou |
| Special category | $16.30  | $15.30          | Hong Kong |

All rates include freight **and duty** to the Lusaka warehouse.

Cargo under 1 kg is billed as 1 kg. That is two rules in two columns, and the
distinction matters: the first tier is stored with **no lower bound** so a 400 g
parcel still MATCHES a rule, and the floor lives in `minChargeableKg`, which the
engine applies after a rule is found. Writing the tier as `minWeightKg: 1` reads
correctly and would leave every sub-kilo parcel unpriced. `npm run
verify:pricing` covers exactly this — see the long note in
[`prisma/price-list.ts`](prisma/price-list.ts).

The `SPECIAL_CATEGORY` **name** is editable in Admin → Company settings, because
the business has not settled on the label. The enum value never moves, so a
rename cannot orphan a priced invoice.

## Differences from Target Express

Reused wholesale: the shipment lifecycle, batches, QR identity and release
scanning, the pricing engine, invoices, credit, the ledger and account spine,
expenses, payroll, reconciliation, investigations, reports, the support desk,
the design system and every UI primitive.

Changed:

- **Zambia, not Tanzania.** `RECEIVED_AT_DAR` → `RECEIVED_AT_ZAMBIA`, ZMW
  instead of TZS (two decimals — the kwacha is ~100× the shilling and rounding
  would lose money on every line), `+260` phone normalisation, Zambian cities,
  Makeni warehouse, Airtel/MTN instead of M-Pesa/Mixx.
- **English, not Kiswahili.** The public site, the customer WhatsApp templates
  and the invoice storage notice. The staff app keeps English + Chinese.
- **No Manager role** — folded into `ADMIN`, see above.
- **Three cargo categories** — Normal goods, Wigs, Special category — replacing
  Normal / Electronics / Liquid-special.
- **Tracking numbers are `AT-…`**, QR tokens `ATQ…`.
- **Rates are published.** Target Express deliberately withheld its rate book;
  AITRANSIT prints its rates on its own flyers, so `/pricing` shows the table
  and `/calculator` prices a real parcel through the real engine.

Added:

- The money desk (above) and `SupplierPayment` / `ExchangeRequest` /
  `PublishedFxRate`.
- The customer portal at `/portal`, with registration at `/register`.
- Five AITRANSIT China services on `SourcingType` — inspection, collection,
  packing, ship-in-advance, pay-on-collection.
- Two reports: money exchange requests, and supplier payments.

## Configuration still needed

Nothing in this repository invents a real-world number. Before going live:

1. **Payment accounts.** `PAYMENT_METHODS` in `lib/constants.ts` ships
   placeholders reading `TO BE CONFIRMED`, and `ACCOUNT_SEED` in
   `lib/account-seed.ts` has null account numbers. Fill both in via
   Admin → Company settings, which snapshots onto every invoice raised after.
2. **The special category's name**, once the business decides it.
3. **The exchange board** — the seeded pairs are marked indicative.
4. `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`.
