import type { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";

import { ChinaServiceForm } from "@/components/portal/request-forms";
import { Empty, PageHead, Panel, Pill, RecordRow } from "@/components/portal/ui";
import { COMPANY } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { listSourcing } from "@/lib/portal-data";
import { CHINA_SERVICES, labelFor, SOURCING_LABEL, SOURCING_TYPE } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "China services — AITRANSIT" };

/**
 * The Guangzhou desk's services, and what a customer has asked for.
 *
 * THE SERVICE LIST IS ON THE PAGE, not hidden behind the form's dropdown. Most
 * customers do not know we inspect goods or repack them for free, and a portal
 * that only lets you request what you already knew to ask for sells nothing.
 * Each card opens the form with that service chosen.
 */
export default async function ChinaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireCustomer();
  const sp = await searchParams;
  const preset = typeof sp.service === "string" ? sp.service : undefined;

  const requests = await listSourcing(viewer.customerId);

  return (
    <div>
      <PageHead
        title="China services"
        lede="What our Guangzhou team can do for you before your cargo ever flies."
      />

      <div className="mb-8">
        <ChinaServiceForm preset={preset} />
      </div>

      {/* ─────────────────────────────────────────────────────── what we offer */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
          What we can do
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CHINA_SERVICES.map((service) => (
            <Link
              key={service.value}
              href={`/portal/china?service=${service.value}`}
              scroll
              className="rounded-[var(--ai-radius-lg)] border p-5 transition-colors"
              style={{
                borderColor: "hsl(var(--ai-stone-3))",
                background: "hsl(var(--ai-white))",
              }}
            >
              <p className="font-semibold">{service.label}</p>
              <p className="ai-muted mt-1 text-sm">{service.blurb}</p>
              <p
                className="mt-3 text-sm font-semibold"
                style={{ color: "hsl(var(--ai-emerald))" }}
              >
                Request this →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────── the warehouse address */}
      <Panel title="Our China warehouse" className="mb-10">
        <p className="ai-muted mb-2 text-sm">
          Have your supplier deliver here. Put your customer code on every carton.
        </p>
        <p className="text-sm font-medium">{COMPANY.chinaAddress}</p>
        <p className="ai-num mt-3 text-sm">
          Mark the cartons: <span className="font-bold">{viewer.code}</span> —{" "}
          {viewer.name}
        </p>
      </Panel>

      {/* ───────────────────────────────────────────────────── my requests */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
          Your requests
        </h2>

        {requests.length === 0 ? (
          <Empty
            icon={Store}
            title="You have not asked for anything yet"
            body="Pick a service above and tell us what you need. Our Guangzhou team picks these up and replies here."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const meta = labelFor(SOURCING_LABEL, req.status);
              return (
                <RecordRow
                  key={req.id}
                  href={`/portal/china/${req.id}`}
                  title={SOURCING_TYPE[req.type] ?? req.type}
                  subtitle={req.product}
                  right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                  facts={[
                    { label: "Reference", value: req.requestNumber },
                    { label: "Asked", value: formatDate(req.createdAt) },
                    ...(req.completedAt
                      ? [{ label: "Finished", value: formatDate(req.completedAt) }]
                      : []),
                  ]}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
