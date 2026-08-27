"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, Search, UserPlus, X } from "lucide-react";

import { AitransitLockup } from "@/components/brand/logo";
import { ThemeSwitch } from "@/components/brand/theme-switch";
import { cn } from "@/lib/utils";

/**
 * The public header.
 *
 * TRANSPARENT OVER THE HERO, SOLID ONCE YOU SCROLL. The homepage opens on a
 * full-bleed sky and a header with its own background would cut a bar across
 * it; the moment the page moves the header earns a surface, so the wordmark
 * never sits on imagery it cannot be read against.
 *
 * ONE DOOR FOR EVERYBODY. There is a single "Log in" for admin, finance, both
 * warehouses, support AND customers — the sign-in page works out where each
 * person belongs from their role, so the site never asks a visitor to
 * self-identify before they have even typed an email. "Customer portal" used to
 * sit here and did exactly that: staff assumed it was not for them.
 *
 * The negative bottom margin is what makes the overlay work — `sticky` still
 * occupies layout space, so without it the header sits as a bar ABOVE the hero
 * rather than on top of it. Every page therefore clears it with its own top
 * padding.
 */

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/markets", label: "China markets" },
  { href: "/calculator", label: "Rates" },
  { href: "/exchange", label: "Exchange" },
  { href: "/appointments", label: "Book" },
  { href: "/track", label: "Track" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  /*
    EVERY public page now opens on a dark banner — the homepage on its sky, the
    rest on `PageHero`, the market directory on a full-bleed photograph — so the
    header floats transparently over all of them and only takes a surface once
    you have scrolled off it. It used to be transparent on the homepage alone,
    which was right when the inside pages opened on stone and is now the thing
    that would make them look like a different site.

    `SOLID_ROUTES` is the escape hatch, and it is here rather than absent
    because the failure mode is bad: a page that opens on a LIGHT surface would
    get white nav links on near-white, invisible until the reader scrolls. Any
    future public page that does not open dark belongs in this list.
  */
  const SOLID_ROUTES: string[] = [];
  const overHero = !SOLID_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const solid = scrolled || !overHero || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  /* An open drawer must not leave the page scrolling underneath it — on iOS
     that reads as the menu sliding off on its own. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 -mb-[4.5rem] transition-colors duration-300",
        solid ? "border-b backdrop-blur-xl" : "bg-transparent"
      )}
      style={
        solid
          ? {
              borderColor: "hsl(var(--ai-stone-3))",
              background: "hsl(var(--ai-stone) / 0.88)",
            }
          : undefined
      }
    >
      <div className="ai-wrap flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" aria-label="AITRANSIT — home" className="shrink-0">
          <AitransitLockup tone={solid ? "brand" : "invert"} />
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-[0.9rem] font-medium transition-colors",
                  solid
                    ? active
                      ? "bg-[hsl(var(--ai-emerald)/0.12)] text-[hsl(var(--ai-emerald))]"
                      : "text-[hsl(var(--ai-charcoal))] hover:bg-[hsl(var(--ai-charcoal)/0.06)]"
                    : active
                      ? "bg-white/15 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/track"
            aria-label="Track cargo"
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full transition-colors md:hidden",
              solid ? "text-[hsl(var(--ai-charcoal))]" : "text-white"
            )}
          >
            <Search className="h-[1.1rem] w-[1.1rem]" />
          </Link>

          <ThemeSwitch tone={solid ? "auto" : "invert"} />

          {/* One door. See the note at the top of this file. */}
          <Link
            href="/login"
            className={cn(
              "ai-btn ai-btn-sm hidden sm:inline-flex",
              solid ? "ai-btn-outline" : "ai-btn-outline-invert"
            )}
          >
            <LogIn className="h-3.5 w-3.5" />
            Log in
          </Link>
          <Link
            href="/register"
            className="ai-btn ai-btn-sm ai-btn-primary hidden lg:inline-flex"
          >
            Sign up
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full transition-colors xl:hidden",
              solid ? "text-[hsl(var(--ai-charcoal))]" : "text-white"
            )}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t xl:hidden"
          style={{
            borderColor: "hsl(var(--ai-stone-3))",
            background: "hsl(var(--ai-stone))",
          }}
        >
          <div className="ai-wrap py-4">
            <nav className="flex flex-col" aria-label="Main">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b py-3.5 text-base font-medium last:border-0"
                  style={{ borderColor: "hsl(var(--ai-stone-3))" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-5 grid grid-cols-2 gap-2.5 pb-2">
              <Link href="/login" className="ai-btn ai-btn-outline">
                <LogIn className="h-4 w-4" />
                Log in
              </Link>
              <Link href="/register" className="ai-btn ai-btn-primary">
                <UserPlus className="h-4 w-4" />
                Sign up
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
