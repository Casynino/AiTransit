import type { Metadata } from "next";
import { MessageCircle, ScaleIcon, ShieldCheck, Timer } from "lucide-react";

import { QuoteCalculator } from "@/components/brand/quote-calculator";
import {
  AsideFacts,
  BtnLink,
  Card,
  PageHero,
  Section,
  SectionHead,
  Wrap,
} from "@/components/brand/ui";
import { COMPANY, STORAGE_POLICY } from "@/lib/constants";
import { MIN_BILLABLE_KG } from "@/lib/billing-policy";
import { publicRateCard } from "@/lib/rate-card";
import { IMAGES } from "@/lib/imagery";
import { PhotoBand } from "@/components/brand/photo-band";
import { Photo } from "@/components/brand/photo";
import { Reveal } from "@/components/brand/motion";

export const metadata: Metadata = {
  title: "Cargo rates & quote",
  description:
    "AITRANSIT air cargo rates from China to Lusaka, duty included. Work out the billable weight, the rate per kilogram and your estimated total.",
};

export default async function CalculatorPage() {
  const categories = await publicRateCard();

  return (
    <>
      <PageHero
        eyebrow="Rates & quote"
        title="Know what it costs before you send it"
        lede={`Every rate below covers freight and duty to our Lusaka warehouse. Cargo under ${MIN_BILLABLE_KG} kg is billed as ${MIN_BILLABLE_KG} kg, and from 10 kg the rate per kilo drops.`}
        photo={IMAGES.cargoHold}
        stats={[
          { value: "USD 13.50", label: "per kg, normal goods" },
          { value: "Duty in", label: "nothing added at the counter" },
          { value: "7 days", label: "free storage in Lusaka" },
        ]}
      />

      <Section tone="stone">
        <Wrap>
          <QuoteCalculator
            categories={categories}
            freeDays={STORAGE_POLICY.freeDays}
            perDayUsd={STORAGE_POLICY.perDayUsd}
            minBillableKg={MIN_BILLABLE_KG}
          />
        </Wrap>
      </Section>

      {/* The full card, for somebody comparing rather than pricing. */}
      <Section tone="alt">
        <Wrap>
          <SectionHead
            eyebrow="The full card"
            title="Published, and the same card your invoice is priced from"
            lede="These figures come out of the rate book our finance desk edits. If a rate changes, this page changes with it — there is no second copy to fall out of step."
            aside={
              <Reveal delay={120}>
                <Photo
                  src={IMAGES.warehouseAisle}
                  alt="The Lusaka warehouse, where the billable weight is confirmed"
                  ratio="wide"
                  width={900}
                  parallax
                  sizes="(max-width: 1024px) 92vw, 42vw"
                  className="shadow-[var(--ai-shadow-lg)]"
                />
                <p
                  className="mt-4 text-[0.82rem]"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  Your invoice is priced from the weight this scale confirms at
                  check-in — not from the figure on the calculator.
                </p>
              </Reveal>
            }
          />

          {categories.length > 0 ? (
            <div className="mt-12 overflow-x-auto">
              <table className="w-full min-w-[38rem] border-collapse text-left">
                <thead>
                  <tr>
                    {["Category", "Weight", "Price per kg", "Route"].map(
                      (head, i) => (
                        <th
                          key={head}
                          scope="col"
                          className="pb-4 text-xs font-bold uppercase tracking-[0.14em]"
                          style={{
                            color: "hsl(var(--ai-charcoal-soft))",
                            textAlign: i === 2 ? "right" : "left",
                          }}
                        >
                          {head}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {categories.flatMap((category) =>
                    category.tiers.map((tier, index) => (
                      <tr
                        key={`${category.category}-${tier.label}`}
                        style={{ borderTop: "1px solid hsl(var(--ai-stone-3))" }}
                      >
                        {index === 0 ? (
                          <th
                            scope="row"
                            rowSpan={category.tiers.length}
                            className="py-5 pr-6 align-top"
                          >
                            <span className="ai-display-sm block">
                              {category.label}
                            </span>
                            <span
                              className="mt-1.5 block max-w-[16rem] text-[0.82rem] font-normal leading-snug"
                              style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                            >
                              {category.examples}
                            </span>
                          </th>
                        ) : null}
                        <td
                          className="py-5 pr-6"
                          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                        >
                          {tier.label}
                        </td>
                        <td className="ai-num py-5 pr-6 text-right font-semibold">
                          {tier.price}
                        </td>
                        {index === 0 ? (
                          <td
                            rowSpan={category.tiers.length}
                            className="py-5 align-top text-sm"
                            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                          >
                            {category.route}
                          </td>
                        ) : null}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </Wrap>
      </Section>

      {/* The three rules that decide the final figure. */}
      <Section tone="ink">
        <Wrap>
          <SectionHead
            eyebrow="How the final bill is decided"
            title="Three rules, stated before you are billed by them"
            lede="None of them is a surprise, and none of them appears for the first time on your invoice."
            aside={
              <AsideFacts
                facts={[
                  { value: `${MIN_BILLABLE_KG} kg`, label: "billed as a minimum" },
                  { value: "10 kg", label: "where the rate drops" },
                  { value: `${STORAGE_POLICY.freeDays} days`, label: "before storage starts" },
                ]}
              />
            }
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: ScaleIcon,
                title: "Our scale decides",
                body: `Your invoice is raised on the weight our Lusaka warehouse confirms at check-in — not your supplier's figure, and not the estimate above. Anything under ${MIN_BILLABLE_KG} kg is billed as ${MIN_BILLABLE_KG} kg.`,
              },
              {
                icon: ShieldCheck,
                title: "Duty is already in it",
                body: COMPANY.dutyNote,
              },
              {
                icon: Timer,
                title: `${STORAGE_POLICY.freeDays} free storage days`,
                body: `Free for ${STORAGE_POLICY.freeDays} days from check-in at Lusaka, then USD ${STORAGE_POLICY.perDayUsd} per day until you collect. Your tracking page shows the running count.`,
              },
            ].map(({ icon: Icon, title, body }) => (
              <Card key={title}>
                <Icon
                  className="h-6 w-6"
                  style={{ color: "hsl(var(--ai-copper))" }}
                />
                <h3 className="ai-display-sm mt-4">{title}</h3>
                <p
                  className="mt-2.5 text-[0.93rem] leading-relaxed"
                  style={{ color: "hsl(var(--ai-stone)/0.66)" }}
                >
                  {body}
                </p>
              </Card>
            ))}
          </div>

          <div className="ai-rule mt-14 flex flex-wrap items-center justify-between gap-6 pt-10">
            <p className="ai-lede max-w-lg">
              Awkward cargo, a large consignment, or something not on the card?
              Send us the details and a person will price it.
            </p>
            <BtnLink
              href={`https://wa.me/${COMPANY.whatsapp}`}
              tone="copper"
              external
            >
              <MessageCircle className="h-4 w-4" />
              Ask for a firm quote
            </BtnLink>
          </div>
        </Wrap>
      </Section>

      <PhotoBand
        src={IMAGES.cargoLoading}
        eyebrow="Next step"
        title="The rate you are quoted is the rate you are billed"
        lede="Duty is already in it, and the only thing that changes the figure is the weight our Lusaka scale confirms at check-in."
        height="short"
      >
        <div className="flex flex-wrap gap-2.5">
          <BtnLink href="/book" tone="copper">
            Book your cargo
          </BtnLink>
          <BtnLink href="/contact" tone="outline-invert">
            Ask for a firm quote
          </BtnLink>
        </div>
      </PhotoBand>
    </>
  );
}
