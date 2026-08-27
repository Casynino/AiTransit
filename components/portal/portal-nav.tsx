"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  Coins,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
} from "lucide-react";

/**
 * The portal's five doors.
 *
 * Flat and short, unlike the staff sidebar. A customer has one question at a
 * time — where is my cargo, what do I owe, what happened to my request — and
 * five links answer all of them with no hierarchy to learn.
 *
 * Scrolls horizontally on a phone rather than collapsing into a menu: five
 * items fit in a swipe, and a drawer would hide the whole of the product behind
 * a tap.
 */
const LINKS = [
  { href: "/portal", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/portal/cargo", label: "My cargo", icon: Package },
  { href: "/portal/invoices", label: "Invoices", icon: Receipt },
  { href: "/portal/appointments", label: "Bookings", icon: CalendarClock },
  { href: "/portal/requests", label: "Requests", icon: FileText },
  { href: "/portal/exchange", label: "Money exchange", icon: Coins },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Customer portal" className="ai-wrap">
      <div className="flex gap-1 overflow-x-auto pb-2.5">
        {LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
              style={
                active
                  ? {
                      background: "hsl(var(--ai-emerald))",
                      borderColor: "hsl(var(--ai-emerald))",
                      color: "white",
                    }
                  : {
                      borderColor: "hsl(var(--ai-stone-3))",
                      background: "hsl(var(--ai-white))",
                      color: "hsl(var(--ai-charcoal-soft))",
                    }
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
