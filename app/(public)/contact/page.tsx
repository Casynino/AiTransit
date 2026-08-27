import Link from "next/link";
import type { Metadata } from "next";
import {
  Building2,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  Warehouse,
} from "lucide-react";

import { PageHero } from "@/components/site/page-hero";
import { SectionBackdrop } from "@/components/site/section-backdrop";
import { Button } from "@/components/ui/button";
import { IMAGES } from "@/lib/imagery";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach AITRANSIT Cargo — our warehouse in Makeni, Lusaka, and our warehouse in Guangzhou, China.",
};

export default function ContactPage() {
  const office = COMPANY.offices[0];

  return (
    <>
      <PageHero
        image={IMAGES.apron}
        eyebrow="Contact us"
        title="Call us or message us"
        body="WhatsApp is the fastest way to reach us. For the status of a consignment, the tracking page answers quicker than we can."
      />

      {/* Fast contact */}
      <section className="relative isolate border-b py-14 md:py-20">
        <SectionBackdrop variant="aurora" />

        <div className="container">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                label: "WhatsApp",
                value: COMPANY.phone,
                href: `https://wa.me/${COMPANY.whatsapp}`,
                note: "Fastest reply",
                accent: true,
              },
              {
                icon: Phone,
                label: "Call us",
                value: COMPANY.phoneAlt,
                href: `tel:${COMPANY.phoneAlt.replace(/\s/g, "")}`,
                note: "Office hours",
              },
              {
                icon: Mail,
                label: "Email",
                value: COMPANY.email,
                href: `mailto:${COMPANY.email}`,
                note: "Invoices and documents",
              },
            ].map(({ icon: Icon, label, value, href, note, accent }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`group rounded-xl border bg-card/85 p-6 shadow-soft backdrop-blur-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                  accent ? "border-signal/40" : ""
                }`}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-signal/10 text-signal">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 font-display text-lg font-semibold">{value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{note}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/*
        The three people, by name.

        A company number alone sends somebody with a Guangzhou question to a
        Lusaka phone. These are the contacts on AITRANSIT's own flyer, each on
        both WeChat and WhatsApp, with the country they sit in — which is the
        fact that decides which one to ring.
      */}
      <section className="border-b py-14 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Who to ask for
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {COMPANY.contacts.map((contact) => (
                <div
                  key={contact.name}
                  className="rounded-xl border bg-card p-6 shadow-soft"
                >
                  <p className="font-display text-lg font-semibold">
                    {contact.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {contact.country === "CHINA" ? "China" : "Zambia"}
                  </p>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="mt-4 block font-mono text-sm tabular hover:text-signal"
                  >
                    {contact.phone}
                  </a>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {contact.channels}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The two warehouses */}
      <section className="border-b py-14 md:py-20">
        <div className="container">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-8 shadow-soft">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                <Warehouse className="h-5 w-5" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {office.flag} Zambia — collection point
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold">
                {office.name}
              </h3>
              <div className="mt-3 space-y-0.5 text-sm text-muted-foreground">
                {office.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <ul className="mt-5 space-y-1 border-t pt-4 text-sm">
                {office.phones.map((phone) => (
                  <li key={phone}>
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="font-mono tabular hover:text-signal"
                    >
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border bg-card p-8 shadow-soft">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                <Building2 className="h-5 w-5" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {COMPANY.chinaOffice.flag} China — supplier drop-off
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold">
                {COMPANY.chinaOffice.city} warehouse
              </h3>
              {/* Chinese first: this block exists to be forwarded to a supplier,
                  and the English underneath is for the customer forwarding it. */}
              <div className="mt-3 space-y-0.5 text-sm font-medium">
                {COMPANY.chinaOffice.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {COMPANY.chinaOffice.addressEn}
                <br />
                {COMPANY.chinaOffice.rooms}
              </p>
              <ul className="mt-5 space-y-1 border-t pt-4 text-sm">
                {COMPANY.chinaOffice.phones.map((phone) => (
                  <li key={phone}>
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="font-mono tabular hover:text-signal"
                    >
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-6 rounded-xl">
                <Link href="/china">
                  <MapPin className="mr-2 h-4 w-4" />
                  Copy the China address
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Before you message us */}
      <section className="py-14 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-2xl border bg-muted/30 p-8 text-center">
            <PackageSearch className="mx-auto h-9 w-9 text-signal" />
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
              Have your tracking number ready
            </h2>
            <p className="mt-3 text-muted-foreground">
              It is on the label stuck to your cargo. With it we can answer in
              one message instead of ten — and the tracking page will usually
              answer before we do.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="signal" className="rounded-xl">
                <Link href="/track">Track cargo</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <a
                  href={`https://wa.me/${COMPANY.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/portal">Customer portal</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
