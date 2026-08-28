import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RaiseClaimForm } from "@/components/portal/claim-forms";
import { Note, PageHead, Panel } from "@/components/portal/ui";
import { requireCustomer } from "@/lib/portal";
import { listCargo } from "@/lib/portal-data";
import { CLAIM_KINDS } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "Raise an issue — AITRANSIT" };

export default async function NewClaimPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireCustomer();
  const sp = await searchParams;
  const preset = typeof sp.cargo === "string" ? sp.cargo : undefined;

  const { rows } = await listCargo(viewer.customerId, {});

  return (
    <div>
      <Link
        href="/portal/claims"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Issues & claims
      </Link>

      <PageHead
        title="Raise an issue"
        lede="Tell us what is wrong and we will investigate. Every update appears on the claim."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Panel>
          <RaiseClaimForm
            cargo={rows.map((r) => ({
              id: r.id,
              trackingNumber: r.trackingNumber,
              description: r.description,
            }))}
            presetCargoId={preset}
          />
        </Panel>

        <div className="space-y-6">
          <Panel title="What you can raise">
            <ul className="space-y-3">
              {CLAIM_KINDS.map((kind) => (
                <li key={kind.value}>
                  <p className="text-sm font-semibold">{kind.label}</p>
                  <p
                    className="text-xs"
                    style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  >
                    {kind.blurb}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>

          <Note tone="amber" title="Photograph it first">
            If cargo is damaged, photograph it before you move it or unpack it
            further. A photograph taken at the counter is what a claim is settled
            on months later.
          </Note>
        </div>
      </div>
    </div>
  );
}
