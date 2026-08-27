"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MoveUpRight, Search, X } from "lucide-react";

import { AitransitLockup } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * The public header.
 *
 * TRANSPARENT OVER THE HERO, SOLID ONCE YOU SCROLL. The homepage opens on a
 * full-bleed navy field and a header with its own background would cut a bar
 * across it; the moment the page moves, the header earns a surface so the
 * wordmark never sits on photography it cannot be read against.
 *
 * Six links and one action, which is the most a header can hold before it stops
 * being scannable. Everything else — the China address, booking, supplier
 * collection — is reached from the page it belongs to rather than promoted to
 * the top of every page in the site.
 */

const NAV = [
  { href: "/services", label: "Cargo services" },
  { href: "/calculator", label: "Rates & quote" },
  { href: "/exchange", label: "Money exchange" },
  { href: "/track", label: "Track" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  /* The homepage is the only page that opens on a dark hero. Everywhere else
     the header sits on stone from the first pixel and needs its surface
     immediately — treating them the same put white-on-stone links on every
     inside page for the first 12px of scroll. */
  const overHero = pathname === "/";
  const solid = scrolled || !overHero || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A route change with the drawer open would otherwise leave it covering the
  // page it just navigated to.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        /*
          The negative bottom margin is what makes the overlay work.

          `sticky` still occupies layout space, so without it the header sat as
          a stone-coloured bar ABOVE the navy hero rather than on top of it —
          and the invert-toned wordmark, drawn for a dark background, vanished
          into it. Pulling the header out of flow lets the hero start at the
          very top of the page and scroll underneath.

          Every page therefore has to clear it itself: the hero does that with
          its own top padding, and PageHero (the inside-page banner) carries the
          same allowance.
        */
        "sticky top-0 z-50 -mb-[4.5rem] transition-colors duration-300",
        solid
          ? "border-b bg-[hsl(var(--ai-stone)/0.92)] backdrop-blur-md"
          : "bg-transparent"
      )}
      style={solid ? { borderColor: "hsl(var(--ai-stone-3))" } : undefined}
    >
      <div className="ai-wrap flex h-[4.5rem] items-center justify-between gap-6">
        <Link href="/" aria-label="AITRANSIT — home" className="shrink-0">
          <AitransitLockup tone={solid ? "brand" : "invert"} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[0.92rem] font-medium transition-colors",
                  solid
                    ? active
                      ? "bg-[hsl(var(--ai-emerald)/0.1)] text-[hsl(var(--ai-emerald))]"
                      : "text-[hsl(var(--ai-charcoal))] hover:bg-[hsl(var(--ai-ink)/0.05)]"
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
              "grid h-10 w-10 place-items-center rounded-full transition-colors lg:hidden",
              solid ? "text-[hsl(var(--ai-charcoal))]" : "text-white"
            )}
          >
            <Search className="h-[1.15rem] w-[1.15rem]" />
          </Link>

          <Link
            href="/portal"
            className={cn(
              "ai-btn ai-btn-sm hidden sm:inline-flex",
              solid ? "ai-btn-primary" : "ai-btn-outline-invert"
            )}
          >
            Customer portal
            <MoveUpRight className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full transition-colors lg:hidden",
              solid ? "text-[hsl(var(--ai-charcoal))]" : "text-white"
            )}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="border-t lg:hidden"
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
            <div className="mt-5 flex flex-col gap-2.5">
              <Link href="/portal" className="ai-btn ai-btn-primary">
                Customer portal
              </Link>
              <Link href="/register" className="ai-btn ai-btn-outline">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
