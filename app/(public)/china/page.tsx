import type { Metadata } from "next";
import { ArrowRight, Building2, ClipboardCheck, MessageCircle, PackageCheck, Truck } from "lucide-react";

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
import { IMAGES } from "@/lib/imagery";
import { PhotoBand } from "@/components/brand/photo-band";

export const metadata: Metadata = {
  title: "China warehouse address",
  description:
    "The AITRANSIT warehouse address in Guangzhou — send it to your supplier in Chinese, exactly as it appears.",
};

/**
 * The address page.
 *
 * Its entire job is to be forwarded. A customer opens this, copies the Chinese
 * block, and pastes it into WeChat — so the address is the first thing on the
 * page, it is copyable in one tap, and it is reproduced exactly as the company
 * writes it. Nothing is "tidied": a reformatted address is one a driver cannot
 * use at the gate.
 */
export default function ChinaPage() {
  const china = COMPANY.chinaOffice;
  const addressBlock = china.lines.join("\n");
  const markingBlock = `AITRANSIT\nYour name / phone\nPCS / PACKAGE / CTN`;

  return (
    <>
      <PageHero
        eyebrow="China warehouse"
        title="Send your supplier this address"
        lede="Copy the Chinese block below and send it to them on WeChat or WhatsApp. It is what their driver reads at our gate in Baiyun District."
        photo={IMAGES.guangzhouSkyline}
        stats={[
          { value: "Baiyun", label: "district, Guangzhou" },
          { value: "Free", label: "collection from your supplier" },
          { value: "Same day", label: "tracking once it reaches us" },
        ]}
      />

      <Section tone="stone">
        <Wrap>
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <CopyField label="地址 / Address" value={addressBlock}>
                <address className="space-y-1 not-italic text-lg font-medium leading-relaxed">
                  {china.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </CopyField>

              <div className="mt-4">
                <CopyField label="电话 / Phone" value={china.phones.join("\n")}>
                  <ul className="space-y-1">
                    {china.phones.map((phone) => (
                      <li key={phone} className="ai-num font-medium">
                        {phone}
                      </li>
                    ))}
                  </ul>
                </CopyField>
              </div>

              <p
                className="mt-5 text-sm leading-relaxed"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                {china.addressEn} — {china.rooms}
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <BtnLink
                  href={`https://wa.me/${COMPANY.whatsapp}`}
                  tone="primary"
                  external
                >
                  <MessageCircle className="h-4 w-4" />
                  Send it to us to forward
                </BtnLink>
                <BtnLink href="/pickup" tone="outline">
                  Or have us collect it
                </BtnLink>
              </div>
            </div>

            <Card>
              <Eyebrow copper>Tell your supplier to mark the boxes</Eyebrow>
              <p
                className="mt-4 text-[0.95rem] leading-relaxed"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                Three lines, written on every carton. Without your name and
                number on the box, cargo arriving at our counter belongs to
                nobody — and an unmarked pallet is how a consignment sits
                unclaimed for a week.
              </p>
              <div className="mt-6">
                <CopyField label="Shipping mark" value={markingBlock}>
                  <ul className="space-y-1.5 font-medium">
                    <li>AITRANSIT</li>
                    <li>Your name / phone</li>
                    <li>PCS / PACKAGE / CTN</li>
                  </ul>
                </CopyField>
              </div>
              <p
                className="mt-4 text-xs leading-relaxed"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                The last line is the count in the units printed on the carton, so
                the packing list and the pallet agree.
              </p>
            </Card>
          </div>
        </Wrap>
      </Section>

      <Section tone="alt">
        <Wrap>
          <SectionHead
            eyebrow="Once it arrives"
            title="What happens at our counter"
            lede="Everything below is included. You do not need to ask for any of it."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Building2,
                title: "Received and logged",
                body: "Booked in against your name the moment your supplier's driver hands it over.",
              },
              {
                icon: ClipboardCheck,
                title: "Checked and photographed",
                body: "Weighed on our scales, counted, and photographed as a record of its condition.",
              },
              {
                icon: PackageCheck,
                title: "Repacked for the hold",
                body: "Reinforced for the flight at no cost, so it arrives in the shape it left in.",
              },
              {
                icon: Truck,
                title: "Loaded onto a batch",
                body: "Assigned to the next flight out of Guangzhou or Hong Kong, with a tracking number you can follow.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <Card key={title} lift>
                <Icon
                  className="h-5 w-5"
                  style={{ color: "hsl(var(--ai-emerald))" }}
                />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  {body}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-10">
            <BtnLink href="/services" tone="ink">
              Everything we do in China
              <ArrowRight className="h-4 w-4" />
            </BtnLink>
          </div>
        </Wrap>
      </Section>

      <PhotoBand
        src={IMAGES.guangzhouAerial}
        eyebrow="Next step"
        title="Your supplier does not need to know anything about shipping"
        lede="Give them our Baiyun address, or give us theirs and we collect. Either way the next thing you see is a tracking number."
        height="short"
      >
        <div className="flex flex-wrap gap-2.5">
          <BtnLink href="/pickup" tone="copper">
            Arrange a collection
          </BtnLink>
          <BtnLink href="/book" tone="outline-invert">
            Book your cargo
          </BtnLink>
        </div>
      </PhotoBand>
    </>
  );
}
