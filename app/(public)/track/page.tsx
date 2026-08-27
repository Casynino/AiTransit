import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  Plane,
  Scale,
  SearchX,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { TrackInput } from "@/components/brand/track-input";
import { TrackingTimeline } from "@/components/brand/tracking-timeline";
import {
  Badge,
  BtnLink,
  Card,
  Eyebrow,
  PageHero,
  Section,
  Wrap,
} from "@/components/brand/ui";
import { COMPANY, PAYMENT_METHODS } from "@/lib/constants";
import { formatUsd } from "@/lib/money";
import { trackByCode, type PublicShipment, type TrackingResult } from "@/lib/tracking";

export const metadata: Metadata = {
  title: "Track your cargo",
  description:
    "Enter your AITRANSIT tracking number to see where your cargo is, what it weighs and when it is ready to collect.",
};

/**
 * Public tracking.
 *
 * WHAT IS SAFE TO SHOW WITHOUT A LOGIN is decided in lib/tracking.ts, not here —
 * it builds the response by explicit allow-list, publishes initials rather than
 * names, and never lets an open investigation be overwritten by a cheerful
 * status. This page is presentation only, and deliberately has no access to
 * anything the data layer did not hand it.
 *
 * Anything genuinely sensitive — the invoice PDF, payment history, credit,
 * pickup notes — lives behind the customer portal and is linked to, not shown.
 */
export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const result: TrackingResult | null = q ? await trackByCode(q) : null;

  return (
    <>
      <PageHero
        eyebrow="Track cargo"
        title="Where is my cargo?"
        lede="Enter the tracking number from the label on your box. It works from the moment we register it in Guangzhou until you collect it in Makeni."
      >
        <TrackInput autoFocus={!q} />
      </PageHero>

      <Section tone="stone">
        <Wrap>
          {!result ? <EmptyState /> : null}
          {result?.kind === "not-found" ? <NotFound query={result.query} /> : null}
          {result?.kind === "batch" ? (
            <Card className="mx-auto max-w-2xl">
              <Eyebrow>Batch</Eyebrow>
              <h2 className="ai-display mt-4">{result.batchNumber}</h2>
              <p className="ai-lede mt-3">{result.statusLabel}</p>
              <dl className="mt-8 grid gap-5 sm:grid-cols-2">
                <Fact label="Consignments on board">
                  {result.shipmentCount}
                </Fact>
                <Fact label="Loaded at">{result.origin}</Fact>
                <Fact label="Departed">{result.departureDate ?? "—"}</Fact>
                <Fact label="Arrived">{result.arrivalDate ?? "—"}</Fact>
              </dl>
              {/* Deliberately no manifest. A batch number is not a credential,
                  and listing the cargo inside one would expose every customer
                  on that flight to anybody who knows it. */}
              <p
                className="mt-8 text-sm leading-relaxed"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                For your own consignment, search the tracking number on your
                label instead — a batch number shows flight status only.
              </p>
            </Card>
          ) : null}
          {result?.kind === "shipment" ? <ShipmentView shipment={result} /> : null}
        </Wrap>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ pieces */

function Fact({
  label,
  children,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  tone?: "warning" | "success";
}) {
  return (
    <div>
      <dt
        className="text-[0.68rem] font-bold uppercase tracking-[0.14em]"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        {label}
      </dt>
      <dd
        className="mt-1.5 font-semibold"
        style={{
          color:
            tone === "warning"
              ? "hsl(28 72% 38%)"
              : tone === "success"
                ? "hsl(var(--ai-emerald))"
                : undefined,
        }}
      >
        {children}
      </dd>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Package
        className="mx-auto h-8 w-8"
        style={{ color: "hsl(var(--ai-emerald))" }}
      />
      <h2 className="ai-display mt-5">Your tracking number is on the label</h2>
      <p className="ai-lede mx-auto mt-4 max-w-xl">
        We stick it on every box in Guangzhou. It looks like{" "}
        <span className="ai-num font-semibold">AT-000123</span> — the dash is
        optional and capitals do not matter.
      </p>
      <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
        {[
          {
            icon: Plane,
            title: "From day one",
            body: "The number works the moment we register your cargo in China, before it flies.",
          },
          {
            icon: ShieldCheck,
            title: "Safe to share",
            body: "This page shows status, weight and storage — never your name, your bill or your contact details.",
          },
          {
            icon: Wallet,
            title: "More in your portal",
            body: "Invoices, payments, pickup notes and credit live behind your account.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <Icon className="h-5 w-5" style={{ color: "hsl(var(--ai-copper))" }} />
            <h3 className="mt-3.5 font-semibold">{title}</h3>
            <p
              className="mt-1.5 text-sm leading-relaxed"
              style={{ color: "hsl(var(--ai-charcoal-soft))" }}
            >
              {body}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NotFound({ query }: { query: string }) {
  return (
    <Card className="mx-auto max-w-2xl text-center">
      <SearchX
        className="mx-auto h-8 w-8"
        style={{ color: "hsl(var(--ai-copper))" }}
      />
      <h2 className="ai-display mt-5">Nothing found for that number</h2>
      <p className="ai-lede mx-auto mt-4 max-w-md">
        We looked for{" "}
        <span className="ai-num font-semibold">{query}</span> and found no
        consignment. That usually means a digit is off, or your supplier has not
        delivered to our Guangzhou counter yet.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        <BtnLink
          href={`https://wa.me/${COMPANY.whatsapp}`}
          tone="primary"
          external
        >
          <MessageCircle className="h-4 w-4" />
          Ask us to check
        </BtnLink>
        <BtnLink href="/china" tone="outline">
          Our China address
        </BtnLink>
      </div>
    </Card>
  );
}

function ShipmentView({ shipment }: { shipment: PublicShipment }) {
  const { investigation, charge, storage, estimate } = shipment;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Headline card: what it is and where it is. */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Eyebrow>Consignment</Eyebrow>
            <h2 className="ai-num mt-3 text-3xl font-semibold">
              {shipment.trackingNumber}
            </h2>
            <p
              className="mt-2"
              style={{ color: "hsl(var(--ai-charcoal-soft))" }}
            >
              {shipment.description} · {shipment.customerInitials}
            </p>
          </div>
          <div className="text-right">
            <Badge
              tone={
                investigation?.blocksCollection
                  ? "copper"
                  : shipment.collectable
                    ? "emerald"
                    : "ink"
              }
            >
              {shipment.statusLabel}
            </Badge>
            <p
              className="mt-2.5 flex items-center justify-end gap-1.5 text-sm"
              style={{ color: "hsl(var(--ai-charcoal-soft))" }}
            >
              <MapPin className="h-3.5 w-3.5" />
              {shipment.location}
            </p>
          </div>
        </div>

        <dl
          className="mt-8 grid gap-6 border-t pt-7 sm:grid-cols-2 lg:grid-cols-4"
          style={{ borderColor: "hsl(var(--ai-stone-3))" }}
        >
          <Fact label="Packages">{shipment.packagesLabel}</Fact>
          <Fact label="Weight">
            {shipment.weightKg === null
              ? "Not yet weighed"
              : `${shipment.weightKg.toFixed(2)} kg`}
          </Fact>
          <Fact label="Batch">{shipment.batchNumber ?? "Not yet assigned"}</Fact>
          <Fact label="Loaded at">{shipment.origin}</Fact>
        </dl>

        {shipment.packageProgress ? (
          <p
            className="mt-6 flex items-center gap-2 text-sm"
            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
          >
            <Boxes className="h-4 w-4" />
            {shipment.packageProgress.label}
          </p>
        ) : null}
      </Card>

      {/* An open investigation speaks over everything else. */}
      {investigation ? (
        <div
          className="mt-5 rounded-[var(--ai-radius-lg)] border p-6"
          style={{
            borderColor: "hsl(38 92% 50% / 0.4)",
            background: "hsl(38 92% 50% / 0.07)",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0"
              style={{ color: "hsl(28 72% 40%)" }}
            />
            <div>
              <h3 className="font-semibold" style={{ color: "hsl(28 72% 32%)" }}>
                {investigation.label}
              </h3>
              <p
                className="mt-1.5 text-[0.95rem] leading-relaxed"
                style={{ color: "hsl(28 40% 30%)" }}
              >
                {investigation.note}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Journey */}
        <Card>
          <Eyebrow>Journey</Eyebrow>
          <div className="mt-7">
            <TrackingTimeline entries={shipment.timeline} />
          </div>
          {shipment.expectedArrival && !shipment.collectable ? (
            <p
              className="mt-7 flex items-center gap-2 border-t pt-6 text-sm"
              style={{
                borderColor: "hsl(var(--ai-stone-3))",
                color: "hsl(var(--ai-charcoal-soft))",
              }}
            >
              <Clock className="h-4 w-4" />
              Expected in Lusaka around {shipment.expectedArrival}
            </p>
          ) : null}
        </Card>

        <div className="space-y-5">
          {/* Collection */}
          <Card>
            <Eyebrow>Collection</Eyebrow>
            <p
              className="mt-4 flex items-start gap-2.5 text-[0.95rem] leading-relaxed"
              style={{ color: "hsl(var(--ai-charcoal-soft))" }}
            >
              {shipment.collectable ? (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "hsl(var(--ai-emerald))" }}
                />
              ) : (
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              {shipment.collectionNote}
            </p>
            {shipment.collectable ? (
              <address
                className="mt-5 border-t pt-5 not-italic text-sm leading-relaxed"
                style={{
                  borderColor: "hsl(var(--ai-stone-3))",
                  color: "hsl(var(--ai-charcoal-soft))",
                }}
              >
                {COMPANY.offices[0].lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            ) : null}
          </Card>

          {/* Storage clock */}
          {storage ? (
            <Card>
              <Eyebrow>Storage</Eyebrow>
              <dl className="mt-5 grid grid-cols-2 gap-5">
                <Fact label="Checked in">{storage.arrivedAt}</Fact>
                <Fact label="Days on our floor">{storage.daysInWarehouse}</Fact>
                <Fact label="Free days left">
                  {storage.collected ? "—" : storage.freeDaysRemaining}
                </Fact>
                <Fact
                  label="Fee so far"
                  tone={storage.chargeUsd > 0 ? "warning" : undefined}
                >
                  {formatUsd(storage.chargeUsd)}
                </Fact>
              </dl>
              <p
                className="mt-5 border-t pt-4 text-xs leading-relaxed"
                style={{
                  borderColor: "hsl(var(--ai-stone-3))",
                  color: "hsl(var(--ai-charcoal-soft))",
                }}
              >
                {storage.waivedUsd > 0
                  ? `Storage of ${formatUsd(storage.waivedUsd)} has been waived by our office — there is nothing to pay.`
                  : `Free for ${storage.freeDays} days from check-in, then USD ${storage.perDayUsd} a day until you collect.`}
              </p>
            </Card>
          ) : null}

          {/* What it costs */}
          {charge ? (
            <Card>
              <div className="flex items-center justify-between gap-3">
                <Eyebrow>Your bill</Eyebrow>
                <Badge tone={charge.status === "PAID" ? "emerald" : "copper"}>
                  {charge.status === "PAID"
                    ? "Paid"
                    : charge.status === "PART_PAID"
                      ? "Part paid"
                      : "Unpaid"}
                </Badge>
              </div>
              <p className="ai-num mt-4 text-2xl font-semibold">
                {formatUsd(charge.outstanding)}
                <span
                  className="ml-2 text-sm font-normal"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  {charge.outstanding > 0 ? "outstanding" : "settled"}
                </span>
              </p>
              {charge.outstandingLocal !== null && charge.localCurrency ? (
                <p
                  className="ai-num mt-1 text-sm"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  ≈ {charge.localCurrency}{" "}
                  {charge.outstandingLocal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              ) : null}

              {charge.mayChange ? (
                <p
                  className="mt-4 text-xs leading-relaxed"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  {charge.mayChange}
                </p>
              ) : null}

              {charge.outstanding > 0 ? (
                <details
                  className="mt-5 border-t pt-4"
                  style={{ borderColor: "hsl(var(--ai-stone-3))" }}
                >
                  <summary className="cursor-pointer text-sm font-semibold">
                    Where to pay
                  </summary>
                  <ul className="mt-4 space-y-3.5">
                    {PAYMENT_METHODS.map((account) => (
                      <li key={account.label}>
                        <span
                          className="block text-[0.66rem] font-bold uppercase tracking-[0.13em]"
                          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                        >
                          {account.label}
                        </span>
                        <span className="ai-num text-sm font-semibold">
                          {account.number}
                        </span>
                        <span
                          className="block text-xs"
                          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                        >
                          {account.accountName}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p
                    className="mt-4 text-xs"
                    style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  >
                    Quote{" "}
                    <span className="ai-num font-semibold">
                      {shipment.trackingNumber}
                    </span>{" "}
                    as the reference, and send the proof on WhatsApp.
                  </p>
                </details>
              ) : null}

              <p
                className="mt-5 border-t pt-4 text-xs"
                style={{
                  borderColor: "hsl(var(--ai-stone-3))",
                  color: "hsl(var(--ai-charcoal-soft))",
                }}
              >
                Full invoice and payment history are in{" "}
                <Link href="/portal" className="ai-link">
                  your portal
                </Link>
                .
              </p>
            </Card>
          ) : estimate ? (
            <Card>
              <Eyebrow>Estimated cost</Eyebrow>
              <p className="ai-num mt-4 text-2xl font-semibold">
                {estimate.currency} {estimate.total.toFixed(2)}
              </p>
              <p
                className="mt-3 text-xs leading-relaxed"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                {estimate.basis} This is the rate book applied to the weight we
                hold — your invoice is raised once our Lusaka warehouse confirms
                the weight on the scale.
              </p>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Condition photos, if the counter took any. */}
      {shipment.photos.length > 0 ? (
        <Card className="mt-5">
          <Eyebrow>Photographed at our counter</Eyebrow>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {shipment.photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-[4/3] overflow-hidden rounded-[var(--ai-radius)]"
                style={{ background: "hsl(var(--ai-stone-2))" }}
              >
                <Image
                  src={photo.url}
                  alt="Your cargo at our warehouse"
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <p
            className="mt-4 flex items-center gap-2 text-xs"
            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
          >
            <Scale className="h-3.5 w-3.5" />
            Taken when we received and weighed your cargo, as a record of its
            condition.
          </p>
        </Card>
      ) : null}

      <p
        className="mt-8 text-center text-sm"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        Something not right?{" "}
        <a
          href={`https://wa.me/${COMPANY.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ai-link"
        >
          Message us with this number
        </a>
      </p>
    </div>
  );
}
