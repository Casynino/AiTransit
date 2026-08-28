import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  MapPin,
  MessageCircle,
  Phone,
  PlaneTakeoff,
  ShieldCheck,
  Warehouse,
} from "lucide-react";

import { Corridor } from "@/components/brand/corridor";
import { CountUp, Reveal } from "@/components/brand/motion";
import { FeatureSplit, PhotoBand } from "@/components/brand/photo-band";
import { Photo, PhotoDuo } from "@/components/brand/photo";
import { CargoGlobe } from "@/components/ui/cargo-globe";
import {
  BtnLink,
  Card,
  PageHero,
  Section,
  SectionHead,
  Wrap,
} from "@/components/brand/ui";
import { COMPANY, STORAGE_POLICY } from "@/lib/constants";
import { IMAGES } from "@/lib/imagery";

export const metadata: Metadata = {
  title: "Who we are — AITRANSIT",
  description:
    "A Zambian air cargo company with its own warehouse in Guangzhou. See the people, the two warehouses, and the exact route your cargo takes from China to Lusaka.",
};

/**
 * Who we are.
 *
 * THE PAGE EXISTS TO ANSWER ONE SUSPICION. Anybody sending money and goods
 * halfway around the world to a company they found online is asking whether
 * that company is real. Every section here is an answer to that, and the
 * answers are all things that can be checked: a street address in Baiyun
 * District, a warehouse in Makeni, three people with telephone numbers, and
 * the actual airports the cargo passes through.
 *
 * SO: NO STOCK PORTRAITS AND NO INVENTED NUMBERS. The team section names the
 * three people on the company's own flyer, the ones who answer WeChat and
 * WhatsApp, and shows monograms until real photographs exist — a stranger's
 * face captioned as our operations manager is exactly the lie this page is
 * supposed to disprove. The figures in the band are things that are true and
 * verifiable (two airports, two hubs, seven free days), not shipment counts
 * nobody can audit.
 *
 * THE CENTREPIECE IS THE CORRIDOR. Customers genuinely do not know why their
 * cargo "went to Dubai" when they are shipping to Zambia, and the honest answer
 * — there is no non-stop freighter, it connects at a hub — is far more
 * reassuring than silence. It is drawn twice: on the globe, which shows where
 * these places are, and as a schematic, which shows how they join up.
 */
export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Who we are"
        title="Zambian company. Chinese warehouse. One line between them."
        lede="AITRANSIT is not a broker forwarding your cargo to somebody else. We take it in at our own counter in Guangzhou, fly it on our own bookings, clear it ourselves, and hand it to you in Makeni. The same company at both ends of the journey."
        photo={IMAGES.apronCrew}
        stats={[
          { value: "2", label: "airports we load from" },
          { value: "2", label: "hubs we connect through" },
          { value: `${COMPANY.promiseDays}`, label: "days, China to Lusaka" },
        ]}
      >
        <div className="flex flex-wrap gap-2.5">
          <BtnLink href="/calculator" tone="copper">
            Price your cargo
          </BtnLink>
          <BtnLink href="/contact" tone="outline-invert">
            Talk to a person
          </BtnLink>
        </div>
      </PageHero>

      {/* ─────────────────────────────────────────────────────────── the story */}
      <Section>
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <Reveal>
              <SectionHead
                eyebrow="Our story"
                title="Built by people who got tired of losing boxes"
              />
              <div className="ai-prose mt-6 space-y-4">
                <p>
                  Everybody buying from China in Zambia has the same three
                  stories. The supplier who took the deposit and went quiet. The
                  carton that arrived open. The bill for duty nobody mentioned
                  when the price was quoted.
                </p>
                <p>
                  AITRANSIT was built by Zambians on both ends of that route to
                  take those three stories off the table. We put a warehouse in
                  Baiyun District so there is somewhere real for your supplier to
                  deliver — a counter, a scale, a camera. We photograph every
                  consignment before it flies and again when it lands, so
                  condition is a matter of record rather than of memory. And we
                  settle the duty ourselves, so the figure we quote is the figure
                  you pay.
                </p>
                <p>
                  We are a small company and we answer our own telephones. If
                  something goes wrong, you will speak to somebody who can
                  actually go and look at your cargo.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <PhotoDuo
                main={IMAGES.warehouseTablet}
                inset={IMAGES.boxHandover}
                mainAlt="Our warehouse team checking a consignment in"
                insetAlt="Cargo handed over at the counter"
              />
            </Reveal>
          </div>
        </Wrap>
      </Section>

      {/* ────────────────────────────────────────────── what we actually promise */}
      <Section tone="alt">
        <Wrap>
          <SectionHead
            eyebrow="What we hold ourselves to"
            title="Four things, and we publish all of them"
            lede="Not values on a wall. Each of these is enforced by the system that runs the business, and you can check every one of them from your own account."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Duty is in the price",
                body: "Our rate covers freight and import duty to our Lusaka warehouse. There is no second bill when it lands.",
              },
              {
                icon: Warehouse,
                title: "Weighed on our own scale",
                body: "In Guangzhou when we take it in, and again in Lusaka. The Lusaka weight is what you are charged on, and you can see both.",
              },
              {
                icon: PlaneTakeoff,
                title: "Photographed both ends",
                body: "Every consignment, every time. If something arrives damaged, there is a picture of what it looked like before it flew.",
              },
              {
                icon: Building2,
                title: `${STORAGE_POLICY.freeDays} free days, then it is charged`,
                body: `Storage is free for ${STORAGE_POLICY.freeDays} days after check-in, then USD ${STORAGE_POLICY.perDayUsd} a day. We tell you before it starts, not after.`,
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <Card className="h-full">
                  <item.icon
                    className="h-5 w-5"
                    style={{ color: "hsl(var(--ai-emerald))" }}
                  />
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="ai-muted mt-2 text-sm">{item.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </Section>

      {/* ──────────────────────────────────────────────────────── the corridor */}
      <Section id="route">
        <Wrap>
          <SectionHead
            eyebrow="The route"
            title="Where your cargo actually goes"
            lede="There is no non-stop freighter between China and Zambia. Your cargo leaves Guangzhou or Hong Kong, changes aircraft at a hub, and lands in Lusaka. Which hub depends on the space we can get that week — here is the whole network."
          />

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
            <Reveal>
              <Corridor />
            </Reveal>

            <Reveal delay={140}>
              <div
                className="ai-on-ink overflow-hidden rounded-[var(--ai-radius-lg)] p-6"
                style={{ boxShadow: "var(--ai-shadow-lg)" }}
              >
                <p
                  className="text-[0.68rem] font-bold uppercase tracking-[0.16em]"
                  style={{ color: "hsl(var(--ai-emerald))" }}
                >
                  On the earth
                </p>
                <h3 className="ai-display-sm mt-2">The same route, spinning</h3>
                <p className="ai-lede mt-2 text-sm">
                  Drag it. The aircraft are on the real great circles between the
                  real airports.
                </p>
                <CargoGlobe className="mx-auto mt-4 w-full max-w-[19rem]" />
              </div>
            </Reveal>
          </div>
        </Wrap>
      </Section>

      {/* ───────────────────────────────────────── what happens to your box */}
      <PhotoBand
        src={IMAGES.cargoHold}
        eyebrow="Inside the operation"
        title="Nine things happen to your box, and you can watch eight of them"
        lede="From the moment your supplier puts it on our counter to the moment you sign for it, every step is recorded against your tracking number — with the date, the batch and the flight."
        height="tall"
      />

      <Section>
        <Wrap>
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["Your supplier delivers", "They drop the goods at our Guangzhou counter. That is the whole of your part."],
              ["We book it in", "Weighed, counted, photographed and labelled with the tracking number you follow it by."],
              ["It goes on a loading table", "Guangzhou or Hong Kong, chosen by what the cargo is — not by you, and not at random."],
              ["The flight is booked", "Airline, flight number and waybill recorded against your consignment."],
              ["It flies and it connects", "Out of China to Dubai or Addis Ababa, then onward to Lusaka on the next available lift."],
              ["We clear it", "Duty settled by us at Kenneth Kaunda International. No second bill for you."],
              ["Checked in at Makeni", "Every package counted against the manifest and weighed again on our scale."],
              ["Priced and invoiced", "Finance confirms the figure. Your invoice keeps the rate it was raised at, permanently."],
              ["You collect", "Pickup note scanned against your cargo at the counter, and photographed as it leaves."],
            ].map(([title, body], i) => (
              <Reveal as="li" key={title} delay={i * 60}>
                <div
                  className="h-full rounded-[var(--ai-radius-lg)] border p-5"
                  style={{
                    borderColor: "hsl(var(--ai-stone-3))",
                    background: "hsl(var(--ai-white))",
                  }}
                >
                  <span
                    className="ai-num text-[0.7rem] font-bold tracking-[0.2em]"
                    style={{ color: "hsl(var(--ai-copper))" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-semibold">{title}</h3>
                  <p className="ai-muted mt-1.5 text-sm">{body}</p>
                </div>
              </Reveal>
            ))}
          </ol>

          <p className="ai-muted mt-6 text-sm">
            The one you cannot watch is the clearing — customs is not ours to
            show. Everything else turns up on your tracking page as it happens.{" "}
            <Link href="/track" className="font-semibold underline underline-offset-2">
              Try it with a tracking number
            </Link>
            .
          </p>
        </Wrap>
      </Section>

      {/* ───────────────────────────────────────────────────────── the people */}
      <Section tone="alt">
        <Wrap>
          <SectionHead
            eyebrow="The people"
            title="Three numbers, three people, both countries"
            lede="Not a contact form that goes nowhere. These are the people who answer, on WeChat and WhatsApp, in China and in Zambia."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMPANY.contacts.map((person, i) => (
              <Reveal key={person.name} delay={i * 90}>
                <Card className="h-full">
                  <div className="flex items-center gap-4">
                    {/*
                      A MONOGRAM, NOT A STOCK PORTRAIT.

                      This page exists to show a customer that AITRANSIT is real.
                      Putting a photograph of a stranger under a real employee's
                      name is precisely the deception it is arguing against — so
                      until there are photographs of these three people, they get
                      their initial and their country.
                    */}
                    <span
                      className="ai-num grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-bold"
                      style={{
                        background: "hsl(var(--ai-emerald-soft))",
                        color: "hsl(var(--ai-emerald))",
                      }}
                      aria-hidden
                    >
                      {person.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{person.name}</h3>
                      <p
                        className="text-[0.68rem] font-bold uppercase tracking-[0.14em]"
                        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                      >
                        {person.country === "CHINA"
                          ? "China · Guangzhou"
                          : "Zambia · Lusaka"}
                      </p>
                    </div>
                  </div>

                  <p className="ai-muted mt-4 text-sm">
                    {person.country === "CHINA"
                      ? "At the Guangzhou warehouse. Speak to them about suppliers, collections, inspection and what to send."
                      : "At the Makeni warehouse. Speak to them about arrival, payment, collection and anything that has gone wrong."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`tel:${person.phone.replace(/\s/g, "")}`}
                      className="ai-btn ai-btn-outline ai-btn-sm"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span className="ai-num">{person.phone}</span>
                    </a>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{
                        background: "hsl(var(--ai-stone-2))",
                        color: "hsl(var(--ai-charcoal-soft))",
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {person.channels}
                    </span>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </Section>

      {/* ──────────────────────────────────────────────────── the two buildings */}
      <FeatureSplit
        src={IMAGES.warehouseAisle}
        eyebrow="Guangzhou"
        title="Where your supplier delivers"
        points={[
          COMPANY.chinaOffice.addressEn,
          COMPANY.chinaOffice.rooms,
          "Send your supplier the Chinese address — their driver reads it off a phone at the gate.",
        ]}
      >
        <p>
          A counter, a scale and a camera in Baiyun District. Your supplier
          delivers here and we take it from there — we can also collect from
          them, inspect what they sent, repack it and pay them on your behalf.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <BtnLink href="/china" tone="outline">
            Our China services
          </BtnLink>
          <BtnLink href="/markets" tone="ink">
            The markets we know
          </BtnLink>
        </div>
      </FeatureSplit>

      <FeatureSplit
        src={IMAGES.lusakaShopfront}
        eyebrow="Lusaka"
        title="Where you collect"
        flip
        points={[
          COMPANY.zambiaAddress,
          `Storage free for ${STORAGE_POLICY.freeDays} days, then USD ${STORAGE_POLICY.perDayUsd} a day.`,
          "Bring your pickup note and ID. We scan it against your cargo before it leaves.",
        ]}
      >
        <p>
          Makeni, off Chifundo Road, behind Finca Bank. Duty is already settled
          by the time your cargo reaches this floor, so collection is a matter of
          paying the invoice you were shown and signing for the boxes.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <BtnLink href="/track" tone="outline">
            Track a consignment
          </BtnLink>
          <BtnLink href="/appointments" tone="ink">
            Book a collection
          </BtnLink>
        </div>
      </FeatureSplit>

      {/* ────────────────────────────────────────────────────────────── the ask */}
      <Section tone="ink">
        <Wrap>
          <div className="mx-auto max-w-2xl text-center">
            <SectionHead
              eyebrow="Start with us"
              title="Send one carton and see"
              lede="You do not have to move your whole business at once. Price a consignment, send your supplier our address, and watch it come."
              align="center"
            />
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <BtnLink href="/calculator" tone="copper">
                Price your cargo
              </BtnLink>
              <BtnLink href="/register" tone="outline-invert">
                Open an account
              </BtnLink>
              <BtnLink href="/contact" tone="outline-invert">
                Ask us anything
              </BtnLink>
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  );
}
