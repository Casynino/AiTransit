import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Boxes,
  ClipboardCheck,
  HandCoins,
  PackageCheck,
  Plane,
  Receipt,
  ShieldCheck,
  Truck,
} from "lucide-react";

import {
  Badge,
  BtnLink,
  Card,
  Eyebrow,
  PageHero,
  Section,
  SectionHead,
  Wrap,
} from "@/components/brand/ui";
import { COMPANY, STORAGE_POLICY } from "@/lib/constants";
import { MIN_BILLABLE_KG } from "@/lib/billing-policy";
import { IMAGES } from "@/lib/imagery";
import { PhotoBand } from "@/components/brand/photo-band";
import { PhotoDuo } from "@/components/brand/photo";

export const metadata: Metadata = {
  title: "Cargo services",
  description:
    "Air cargo from China to Lusaka with duty included, supplier payments in RMB, free inspection, packing and collection in Guangzhou.",
};

/**
 * What AITRANSIT actually does, told as one continuous service rather than a
 * grid of features.
 *
 * The structure follows the customer's own sequence — before the goods exist,
 * while they are in China, in the air, and after they land — because that is
 * how somebody decides whether a forwarder covers the part they are worried
 * about. A grid of six equal cards makes every service look optional; this
 * makes clear that most of them happen whether you ask or not.
 */

const IN_CHINA = [
  {
    icon: HandCoins,
    title: "We pay your supplier",
    body: "Send us the factory's details and the amount. Our China desk checks them, confirms the figure with you, pays in RMB and sends the proof the same day. If the goods are flying with us, the payment is filed against your cargo.",
    tag: "Chargeable",
  },
  {
    icon: ClipboardCheck,
    title: "Inspection before packing",
    body: "We open the cartons and check what is inside against your order — quantity, model, obvious damage — and photograph what we find. Cheaper to catch in Guangzhou than to argue about in Lusaka.",
    tag: "Free",
  },
  {
    icon: Truck,
    title: "Collection from the supplier",
    body: "Your supplier does not need to arrange anything. Give us the address and we collect from their door, anywhere in Guangzhou.",
    tag: "Free",
  },
  {
    icon: PackageCheck,
    title: "Repacking for the hold",
    body: "We reinforce and repack your goods for the flight at no cost. A carton built for a warehouse shelf is not built for an aircraft hold.",
    tag: "Free",
  },
];

const AFTER = [
  {
    icon: Plane,
    title: "Send in advance, no deposit",
    body: "Established customers ship first and settle later. Nothing is required up front to get your goods moving.",
  },
  {
    icon: Receipt,
    title: "Pay the freight when you collect",
    body: "Settle at our Makeni counter when you pick the cargo up, rather than before it leaves China.",
  },
  {
    icon: ShieldCheck,
    title: "Released only against a scan",
    body: "Cargo is handed over when the QR label put on it in China scans against a valid pickup note. That check is the reason nobody else can collect your goods.",
  },
  {
    icon: Boxes,
    title: `${STORAGE_POLICY.freeDays} free days on our floor`,
    body: `Storage is free for ${STORAGE_POLICY.freeDays} days from check-in at Lusaka, then USD ${STORAGE_POLICY.perDayUsd} a day. Your tracking page shows the count, so a fee is never a surprise.`,
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Cargo services"
        title="One company from your supplier's gate to your shop floor"
        lede="Most forwarders start when the cargo reaches their warehouse. We start earlier — paying the factory, checking the goods and collecting them — and we finish later, with duty already settled before your cargo lands."
        media={
          <PhotoDuo
            main={IMAGES.cargoLoading}
            inset={IMAGES.boxHandover}
            mainAlt="Cargo being loaded onto an aircraft"
            insetAlt="A parcel handed across the counter"
            priority
          />
        }
        stats={[
          { value: "6", label: "services, four of them free" },
          { value: "2", label: "airports out of China" },
          { value: "0", label: "duty to pay on arrival" },
        ]}
      >
        <div className="flex flex-wrap gap-2.5">
          <BtnLink href="/calculator" tone="copper">
            Price your cargo
            <ArrowRight className="h-4 w-4" />
          </BtnLink>
          <BtnLink href="/china" tone="outline-invert">
            China warehouse address
          </BtnLink>
        </div>
      </PageHero>

      {/* The headline service, given a band of its own. */}
      <Section tone="stone">
        <Wrap>
          <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <Eyebrow>The core service</Eyebrow>
              <h2 className="ai-display-lg mt-4">
                Air cargo with the duty already in the price
              </h2>
              <p className="ai-lede mt-5">
                {COMPANY.dutyNote} There is no clearing agent for you to appoint,
                no customs bill afterwards, and no adjustment at the counter. The
                figure you are quoted is the figure that lands.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Loaded out of Guangzhou for normal goods and wigs, Hong Kong for the special category.",
                  "Five to twelve days, counter in China to our Lusaka floor.",
                  `Billed on the weight our Lusaka warehouse confirms — anything under ${MIN_BILLABLE_KG} kg counts as ${MIN_BILLABLE_KG} kg.`,
                  "Your own tracking number and QR label from the day we receive it.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "hsl(var(--ai-copper))" }}
                    />
                    <span
                      className="text-[0.97rem] leading-relaxed"
                      style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Card className="lg:justify-self-end lg:max-w-md">
              <Eyebrow copper>What that means on a bill</Eyebrow>
              <dl className="mt-7 space-y-5">
                {[
                  ["Freight, China → Lusaka", "Included"],
                  ["Import duty", "Included"],
                  ["Clearing agent", "Not needed"],
                  ["Handling at Makeni", "Included"],
                  [`First ${STORAGE_POLICY.freeDays} days of storage`, "Included"],
                  ["Inspection, packing, collection", "Free"],
                ].map(([term, value]) => (
                  <div
                    key={term}
                    className="flex items-baseline justify-between gap-4 border-t pt-5 first:border-0 first:pt-0"
                    style={{ borderColor: "hsl(var(--ai-stone-3))" }}
                  >
                    <dt style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
                      {term}
                    </dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <p
                className="mt-7 text-sm"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                Only supplier payments and money exchange are charged separately,
                and both are quoted before you commit.
              </p>
            </Card>
          </div>
        </Wrap>
      </Section>

      {/* While the goods are still in China. */}
      <Section tone="alt">
        <Wrap>
          <SectionHead
            eyebrow="While your goods are in China"
            title="The part most forwarders leave to you"
            lede="Four things that happen before your cargo ever reaches an aircraft. Three of them cost nothing."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {IN_CHINA.map(({ icon: Icon, title, body, tag }) => (
              <Card key={title} lift>
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                    style={{
                      background: "hsl(var(--ai-emerald-soft))",
                      color: "hsl(var(--ai-emerald))",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <Badge tone={tag === "Free" ? "copper" : "ink"}>{tag}</Badge>
                </div>
                <h3 className="ai-display-sm mt-5">{title}</h3>
                <p
                  className="mt-2.5 text-[0.95rem] leading-relaxed"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  {body}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-2.5">
            <BtnLink href="/exchange#pay-supplier" tone="primary">
              <Banknote className="h-4 w-4" />
              Ask us to pay a supplier
            </BtnLink>
            <BtnLink href="/pickup" tone="outline">
              Book a supplier collection
            </BtnLink>
          </div>
        </Wrap>
      </Section>

      {/* After it lands. */}
      <Section tone="ink">
        <Wrap>
          <SectionHead
            eyebrow="Once it lands in Lusaka"
            title="Terms that assume you have a business to run"
          />
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {AFTER.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon
                  className="h-6 w-6"
                  style={{ color: "hsl(var(--ai-copper))" }}
                />
                <h3 className="ai-display-sm mt-4">{title}</h3>
                <p
                  className="mt-2 text-[0.95rem] leading-relaxed"
                  style={{ color: "hsl(var(--ai-stone)/0.66)" }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="ai-rule mt-16 flex flex-wrap items-center justify-between gap-6 pt-10">
            <p className="ai-display-sm max-w-md">
              Ready to send your first consignment?
            </p>
            <div className="flex flex-wrap gap-2.5">
              <BtnLink href="/book" tone="copper">
                Book your cargo
                <ArrowRight className="h-4 w-4" />
              </BtnLink>
              <Link href="/register" className="ai-btn ai-btn-outline-invert">
                Create an account
              </Link>
            </div>
          </div>
        </Wrap>
      </Section>

      <PhotoBand
        src={IMAGES.apron}
        eyebrow="Next step"
        title="Ready when you are"
        lede="Send us the supplier's address and we take it from there — collection, inspection, packing, freight and duty, on one invoice."
        height="short"
      >
        <div className="flex flex-wrap gap-2.5">
          <BtnLink href="/book" tone="copper">
            Book your cargo
          </BtnLink>
          <BtnLink href="/calculator" tone="outline-invert">
            Work out the cost
          </BtnLink>
        </div>
      </PhotoBand>
    </>
  );
}
