import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { AitransitLockup } from "@/components/brand/logo";
import { COMPANY } from "@/lib/constants";

/**
 * The public footer.
 *
 * A navy slab closing the page — the site opens on ink and ends on it, so the
 * stone bands between read as the document and this reads as the cover.
 *
 * BOTH WAREHOUSES, IN FULL. A customer's supplier needs the Guangzhou address
 * and a customer collecting needs the Makeni one, and neither should have to
 * find the contact page to get it. The Chinese text is reproduced exactly as
 * the company writes it, because it is forwarded to suppliers verbatim and a
 * "tidied" address is one a driver cannot use.
 */
export function SiteFooter() {
  const office = COMPANY.offices[0];
  const year = new Date().getFullYear();

  return (
    <footer className="ai-on-ink">
      <div className="ai-wrap py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_repeat(3,minmax(0,1fr))]">
          <div>
            <AitransitLockup tone="invert" tagline />
            <p
              className="mt-6 max-w-xs text-[0.95rem] leading-relaxed"
              style={{ color: "hsl(var(--ai-stone)/0.66)" }}
            >
              Air cargo from China to Lusaka with duty included, supplier
              payments in RMB, and money exchange — one Zambian team on both
              ends of the route.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <a
                href={`https://wa.me/${COMPANY.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ai-btn ai-btn-sm ai-btn-copper"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp us
              </a>
              <Link href="/track" className="ai-btn ai-btn-sm ai-btn-outline-invert">
                Track cargo
              </Link>
            </div>
          </div>

          <FooterNav
            title="Services"
            links={[
              ["Air cargo", "/services"],
              ["Rates & quote", "/calculator"],
              ["Explore China markets", "/markets"],
              ["Money exchange", "/exchange"],
              ["Pay a supplier", "/exchange#pay-supplier"],
              ["China warehouse address", "/china"],
            ]}
          />

          <FooterNav
            title="Your account"
            links={[
              ["Track cargo", "/track"],
              ["Book an appointment", "/appointments"],
              ["Customer portal", "/portal"],
              ["Create an account", "/register"],
              ["Sign in", "/login"],
              ["Contact us", "/contact"],
            ]}
          />

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
              Warehouses
            </h2>
            <ul
              className="mt-5 space-y-5 text-sm"
              style={{ color: "hsl(var(--ai-stone)/0.66)" }}
            >
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ai-copper))]" />
                <span>
                  <span className="block font-semibold text-[hsl(var(--ai-stone))]">
                    Lusaka — collection
                  </span>
                  {office.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ai-copper))]" />
                <span>
                  <span className="block font-semibold text-[hsl(var(--ai-stone))]">
                    Guangzhou — supplier drop-off
                  </span>
                  {COMPANY.chinaOffice.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* The three people a customer or a supplier actually rings. A company
            number alone sends somebody with a Guangzhou question to a Lusaka
            phone. */}
        <div className="ai-rule mt-14 pt-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em]">
            Talk to us
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-3">
            {COMPANY.contacts.map((contact) => (
              <li key={contact.name}>
                <p className="font-semibold">{contact.name}</p>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="ai-num mt-1 block text-sm transition-colors hover:text-[hsl(var(--ai-copper))]"
                  style={{ color: "hsl(var(--ai-stone)/0.78)" }}
                >
                  {contact.phone}
                </a>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: "hsl(var(--ai-stone)/0.62)" }}
                >
                  {contact.channels} ·{" "}
                  {contact.country === "CHINA" ? "China" : "Zambia"}
                </p>
              </li>
            ))}
          </ul>

          <div
            className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm"
            style={{ color: "hsl(var(--ai-stone)/0.66)" }}
          >
            <a
              href={`mailto:${COMPANY.email}`}
              className="inline-flex items-center gap-2 hover:text-[hsl(var(--ai-copper))]"
            >
              <Mail className="h-4 w-4" />
              {COMPANY.email}
            </a>
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 hover:text-[hsl(var(--ai-copper))]"
            >
              <Phone className="h-4 w-4" />
              {COMPANY.phone}
            </a>
          </div>
        </div>

        <div
          className="ai-rule mt-10 flex flex-col justify-between gap-3 pt-7 text-xs sm:flex-row"
          style={{ color: "hsl(var(--ai-stone)/0.56)" }}
        >
          <p>
            © {year} {COMPANY.name}. All rights reserved.{" "}
            {/* On every page, in the place people look for it. Terms nobody can
                find are terms a customer can say they never saw. */}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:opacity-80"
            >
              Terms of business
            </Link>
          </p>
          <p style={{ color: "hsl(var(--ai-copper))" }}>{COMPANY.tagline}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterNav({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-[0.14em]">{title}</h2>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map(([label, href]) => (
          <li key={href + label}>
            <Link
              href={href}
              className="transition-colors hover:text-[hsl(var(--ai-copper))]"
              style={{ color: "hsl(var(--ai-stone)/0.66)" }}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
