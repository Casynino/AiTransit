import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Mail, MapPin, MessageCircle, PackageSearch, Phone, Warehouse } from "lucide-react";

import { CopyField } from "@/components/brand/copy-field";
import {
  BtnLink,
  Card,
  Eyebrow,
  PageHero,
  Section,
  SectionHead,
  Wrap,
} from "@/components/brand/ui";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach AITRANSIT — our Makeni warehouse in Lusaka, our Guangzhou warehouse in China, and the three people who answer.",
};

export default function ContactPage() {
  const office = COMPANY.offices[0];
  const china = COMPANY.chinaOffice;
  const chinaAddress = china.lines.join("\n");
  const zambiaAddress = office.lines.join("\n");

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to a person, in the country your question is in"
        lede="Guangzhou for suppliers, inspection and collection. Lusaka for cargo, money and pickup. All three of us are on WeChat and WhatsApp."
      >
        <div className="flex flex-wrap gap-2.5">
          <BtnLink
            href={`https://wa.me/${COMPANY.whatsapp}`}
            tone="copper"
            external
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp us
          </BtnLink>
          <BtnLink href="/track" tone="outline-invert">
            <PackageSearch className="h-4 w-4" />
            Track cargo instead
          </BtnLink>
        </div>
      </PageHero>

      {/* The three people. */}
      <Section tone="stone">
        <Wrap>
          <SectionHead
            eyebrow="Who to ask for"
            title="Three names, two countries"
            lede="Ring whoever is closest to your question — you will get a person, not a queue."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {COMPANY.contacts.map((contact) => (
              <Card key={contact.name} lift>
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl"
                  style={{
                    background:
                      contact.country === "CHINA"
                        ? "hsl(var(--ai-copper-soft))"
                        : "hsl(var(--ai-emerald-soft))",
                    color:
                      contact.country === "CHINA"
                        ? "hsl(28 72% 34%)"
                        : "hsl(var(--ai-emerald))",
                  }}
                >
                  <Phone className="h-5 w-5" />
                </span>
                <h3 className="ai-display-sm mt-5">{contact.name}</h3>
                <p
                  className="text-[0.7rem] font-bold uppercase tracking-[0.14em]"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  {contact.country === "CHINA" ? "China" : "Zambia"}
                </p>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="ai-num mt-4 block font-semibold transition-colors hover:text-[hsl(var(--ai-emerald))]"
                >
                  {contact.phone}
                </a>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  {contact.channels}
                </p>
              </Card>
            ))}
          </div>

          <div
            className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm"
            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
          >
            <a
              href={`mailto:${COMPANY.email}`}
              className="inline-flex items-center gap-2 hover:text-[hsl(var(--ai-emerald))]"
            >
              <Mail className="h-4 w-4" />
              {COMPANY.email}
            </a>
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 hover:text-[hsl(var(--ai-emerald))]"
            >
              <Phone className="h-4 w-4" />
              {COMPANY.phone}
            </a>
          </div>
        </Wrap>
      </Section>

      {/* Both warehouses, copyable. */}
      <Section tone="alt">
        <Wrap>
          <SectionHead
            eyebrow="Our warehouses"
            title="Where to send goods, and where to collect them"
            lede="Send the Chinese address to your supplier exactly as it appears — it is what their driver reads at our gate."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Card>
              <div className="flex items-center gap-2.5">
                <Warehouse
                  className="h-5 w-5"
                  style={{ color: "hsl(var(--ai-emerald))" }}
                />
                <Eyebrow>{office.flag} Zambia — collection point</Eyebrow>
              </div>
              <h3 className="ai-display mt-5">{office.name}</h3>
              <div className="mt-6">
                <CopyField label="Address" value={zambiaAddress}>
                  <address className="not-italic leading-relaxed">
                    {office.lines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </CopyField>
              </div>
              <ul className="mt-5 space-y-1.5 text-sm">
                {office.phones.map((phone) => (
                  <li key={phone}>
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="ai-num hover:text-[hsl(var(--ai-emerald))]"
                    >
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
              <p
                className="mt-5 text-sm leading-relaxed"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                Bring your pickup note or your tracking number. We scan it
                against your cargo before handing it over.
              </p>
            </Card>

            <Card>
              <div className="flex items-center gap-2.5">
                <Building2
                  className="h-5 w-5"
                  style={{ color: "hsl(var(--ai-copper))" }}
                />
                <Eyebrow copper>{china.flag} China — supplier drop-off</Eyebrow>
              </div>
              <h3 className="ai-display mt-5">{china.city} warehouse</h3>
              <div className="mt-6">
                <CopyField label="地址 / Address" value={chinaAddress}>
                  <address className="space-y-0.5 not-italic font-medium leading-relaxed">
                    {china.lines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </CopyField>
              </div>
              <p
                className="mt-4 text-sm"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                {china.addressEn}
                <br />
                {china.rooms}
              </p>
              <ul className="mt-5 space-y-1.5 text-sm">
                {china.phones.map((phone) => (
                  <li key={phone}>
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="ai-num hover:text-[hsl(var(--ai-copper))]"
                    >
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-5">
                <Link href="/china" className="ai-link">
                  Full instructions for your supplier
                  <MapPin className="h-4 w-4" />
                </Link>
              </p>
            </Card>
          </div>
        </Wrap>
      </Section>

      {/* Before you message. */}
      <Section tone="ink">
        <Wrap narrow className="text-center">
          <PackageSearch
            className="mx-auto h-8 w-8"
            style={{ color: "hsl(var(--ai-copper))" }}
          />
          <h2 className="ai-display-lg mt-6">Have your tracking number ready</h2>
          <p className="ai-lede mx-auto mt-5 max-w-xl">
            It is on the label stuck to your box. With it we can answer in one
            message instead of ten — and the tracking page usually answers before
            we do.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-2.5">
            <BtnLink href="/track" tone="copper">
              Track cargo
            </BtnLink>
            <BtnLink href="/portal" tone="outline-invert">
              Customer portal
            </BtnLink>
          </div>
        </Wrap>
      </Section>
    </>
  );
}
