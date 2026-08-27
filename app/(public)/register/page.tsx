import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Coins, FileText, PackageSearch, Receipt } from "lucide-react";

import { RegisterForm } from "@/components/brand/register-form";
import { Eyebrow, PageHero, Section, Wrap } from "@/components/brand/ui";
import { currentCustomer } from "@/lib/portal";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Register with AITRANSIT to track your cargo, read your invoices, and send supplier-payment and money-exchange requests.",
};

const BENEFITS = [
  {
    icon: PackageSearch,
    title: "Every consignment in one place",
    body: "All the cargo you have shipped with us, with its live status and its storage clock.",
  },
  {
    icon: Receipt,
    title: "Invoices and payments",
    body: "What you owe, what you have paid, and your pickup note the moment it is issued.",
  },
  {
    icon: Coins,
    title: "Exchange and supplier payments",
    body: "Your bookings and the money we have sent to your suppliers, with the proof attached.",
  },
  {
    icon: FileText,
    title: "Requests without a phone call",
    body: "Ask our Guangzhou desk to inspect, collect or pack — and follow what happens.",
  },
];

export default async function RegisterPage() {
  /* Somebody already signed in does not need this page, and showing them a form
     that would refuse them is worse than sending them where they were going. */
  if (await currentCustomer()) redirect("/portal");

  return (
    <>
      <PageHero
        eyebrow="Customer portal"
        title="Create your AITRANSIT account"
        lede="Track your cargo, read your invoices and send us requests — without waiting for a reply on WhatsApp."
      />

      <Section tone="stone">
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <Eyebrow>What you get</Eyebrow>
              <ul className="mt-8 space-y-7">
                {BENEFITS.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                      style={{
                        background: "hsl(var(--ai-emerald-soft))",
                        color: "hsl(var(--ai-emerald))",
                      }}
                    >
                      <Icon className="h-[1.15rem] w-[1.15rem]" />
                    </span>
                    <span>
                      <span className="block font-semibold">{title}</span>
                      <span
                        className="mt-1 block text-[0.93rem] leading-relaxed"
                        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                      >
                        {body}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <RegisterForm />
          </div>
        </Wrap>
      </Section>
    </>
  );
}
