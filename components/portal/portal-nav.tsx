"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, FileText, LayoutDashboard, Package, Receipt } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The portal's five doors.
 *
 * Flat and short, unlike the staff sidebar. A customer has one question at a
 * time — where is my cargo, what do I owe, what happened to my request — and
 * five links answer all of them without a hierarchy to learn.
 */
const LINKS = [
  { href: "/portal", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/portal/cargo", label: "My cargo", icon: Package },
  { href: "/portal/invoices", label: "Invoices", icon: Receipt },
  { href: "/portal/requests", label: "Requests", icon: FileText },
  { href: "/portal/exchange", label: "Money exchange", icon: Coins },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Customer portal"
      className="container flex gap-1 overflow-x-auto pb-2"
    >
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
              active
                ? "border-brand bg-brand text-brand-foreground"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
