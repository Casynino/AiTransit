import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText, PackageSearch, Receipt, Wallet } from "lucide-react";

import { PageHero } from "@/components/site/page-hero";
import { RegisterForm } from "@/components/site/register-form";
import { SectionBackdrop } from "@/components/site/section-backdrop";
import { currentCustomer } from "@/lib/portal";
import { IMAGES } from "@/lib/imagery";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Create an AITRANSIT account to track your cargo, view invoices and submit requests.",
};

const BENEFITS = [
  {
    icon: PackageSearch,
    title: "All your cargo in one place",
    body: "Every consignment you have shipped with us, with its live status and its storage clock.",
  },
  {
    icon: Receipt,
    title: "Your invoices and payments",
    body: "What you owe, what you have paid, and the pickup note when your cargo is ready.",
  },
  {
    icon: Wallet,
    title: "Credit and outstanding balance",
    body: "If we have approved credit for you, your limit and your balance are here.",
  },
  {
    icon: FileText,
    title: "Requests without a phone call",
    body: "Supplier payments, China services and money exchange, submitted and tracked.",
  },
];

export default async function RegisterPage() {
  /* Somebody already signed in does not need this page. Sending them to the
     portal is more useful than showing them a form that would refuse them. */
  const viewer = await currentCustomer();
  if (viewer) redirect("/portal");

  return (
    <>
      <PageHero
        image={IMAGES.warehouseAisle}
        eyebrow="Customer portal"
        title="Create your AITRANSIT account"
        body="Track your cargo, read your invoices and send us requests — without waiting for a reply on WhatsApp."
      />

      <section className="relative isolate bg-[hsl(var(--ink))] py-14 text-white md:py-20">
        <SectionBackdrop variant="aurora" />
        <div className="container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                What you get
              </h2>
              <ul className="mt-8 space-y-6">
                {BENEFITS.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal/15 text-signal">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-display text-base font-semibold">
                        {title}
                      </span>
                      <span className="mt-1 block text-sm text-white/65">
                        {body}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <RegisterForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
