import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { BrandLockup } from "@/components/brand-mark";
import { COMPANY } from "@/lib/constants";

/**
 * The public footer.
 *
 * Two changes from the Target Express original, both forced by the market
 * rather than by taste. The copy is English, because AITRANSIT sells into
 * Lusaka where the trade is done in English — the Kiswahili the old footer
 * carried was the right voice for Lusaka es Salaam and would be noise here.
 * And the social row is WhatsApp and WeChat instead of Instagram and an iPhone
 * app: those are the two channels on every AITRANSIT flyer, and they are the
 * ones a customer in Makeni and a supplier in Guangzhou actually use.
 */
export function SiteFooter() {
  const office = COMPANY.offices[0];

  return (
    <footer className="mt-20 border-t bg-muted/30">
      <div className="container py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandLockup />
            <p className="mt-4 font-display text-lg font-semibold">
              {COMPANY.tagline}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {COMPANY.promise} Air cargo from Guangzhou and Hong Kong to
              Lusaka, with freight and duty included to our Lusaka warehouse.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${COMPANY.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:text-signal"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={`tel:${COMPANY.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:text-signal"
              >
                <Phone className="h-4 w-4" />
                {COMPANY.phone}
              </a>
            </div>

            {/* The three people a customer or supplier actually rings. On the
                flyer and therefore here — a footer that lists only a company
                number sends somebody with a Guangzhou question to a Lusaka
                phone. */}
            <ul className="mt-5 space-y-1 text-sm text-muted-foreground">
              {COMPANY.contacts.map((contact) => (
                <li key={contact.name}>
                  <span className="font-medium text-foreground">
                    {contact.name}
                  </span>{" "}
                  — {contact.phone}{" "}
                  <span className="text-xs">({contact.channels})</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Pages</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="transition-colors hover:text-foreground"
                >
                  Cargo services
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="transition-colors hover:text-foreground"
                >
                  Cargo rates
                </Link>
              </li>
              <li>
                <Link
                  href="/calculator"
                  className="transition-colors hover:text-foreground"
                >
                  Rate calculator
                </Link>
              </li>
              <li>
                <Link
                  href="/exchange"
                  className="transition-colors hover:text-foreground"
                >
                  Money exchange
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="transition-colors hover:text-foreground"
                >
                  Track cargo
                </Link>
              </li>
              <li>
                <Link
                  href="/portal"
                  className="transition-colors hover:text-foreground"
                >
                  Customer portal
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Where to find us</h3>
            <ul className="mt-4 space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="block font-medium text-foreground">
                    {office.name}
                  </span>
                  {office.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="block font-medium text-foreground">
                    China warehouse — {COMPANY.chinaOffice.city}
                  </span>
                  {COMPANY.chinaOffice.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="transition-colors hover:text-foreground"
                >
                  {COMPANY.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </p>
          <p>{COMPANY.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
