"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";

import { AitransitLockup } from "@/components/brand/logo";
import { ThemeSwitch } from "@/components/brand/theme-switch";
import {
  isActive,
  PORTAL_GROUPS,
  PORTAL_LINKS,
  type PortalBadges,
} from "@/components/portal/nav-items";

/**
 * The portal's frame: sidebar on a desk, drawer and bottom bar on a phone.
 *
 * WHY THIS REPLACED THE PILL ROW. The portal used to carry six links in a
 * horizontally scrolling strip, which is a fine pattern for six and falls apart
 * at fourteen: half the product ends up past the right edge of a phone, and
 * nothing tells you it is there. A customer with cargo in China, an unpaid
 * invoice and a claim open needs to move between three unrelated places, and a
 * scroller makes that a hunt.
 *
 * The three surfaces are one list — see nav-items.ts — so they cannot drift.
 *
 * IT IS NOT THE STAFF SIDEBAR. That one is assembled from permissions, because
 * what a clerk may open depends on their department. Nothing here is
 * conditional: every customer has every section, and a section with nothing in
 * it says so on its own page rather than vanishing from the menu. A menu that
 * changes shape as your cargo moves is a menu you cannot learn.
 */
export function PortalShell({
  viewer,
  badges,
  children,
}: {
  viewer: { name: string; code: string };
  badges: PortalBadges;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  /* A tap that navigates should close the drawer it was tapped in. */
  useEffect(() => setDrawer(false), [pathname]);

  /* Escape closes it, and the page beneath must not scroll while it is open. */
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  const phoneBar = PORTAL_LINKS.filter((l) => l.primary);

  return (
    <div className="ai-site min-h-screen" style={{ background: "hsl(var(--ai-stone))" }}>
      {/* ─────────────────────────────────────────────────────────── top bar */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          borderColor: "hsl(var(--ai-stone-3))",
          background: "hsl(var(--ai-stone) / 0.9)",
        }}
      >
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            aria-expanded={drawer}
            className="ai-btn ai-btn-outline ai-btn-sm lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <Link href="/portal" aria-label="AITRANSIT — my account" className="shrink-0">
            <AitransitLockup />
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeSwitch />
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold leading-tight">
                {viewer.name}
              </span>
              <span
                className="ai-num block text-xs"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                {viewer.code}
              </span>
            </span>
            <Link
              href="/api/auth/signout"
              className="ai-btn ai-btn-outline ai-btn-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[100rem] gap-8 px-4 sm:px-6">
        {/* ───────────────────────────────────────────────── desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav
            aria-label="Customer portal"
            className="sticky top-20 space-y-6 py-8"
          >
            {PORTAL_GROUPS.map((group) => (
              <div key={group.title}>
                <p
                  className="px-3 pb-2 text-[0.68rem] font-bold uppercase tracking-[0.16em]"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <NavLink
                        link={link}
                        active={isActive(link, pathname)}
                        count={link.badge ? badges[link.badge] : 0}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* ───────────────────────────────────────────────────────── content */}
        <main className="min-w-0 flex-1 pb-28 pt-8 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>

      {/* ──────────────────────────────────────────────────── mobile drawer */}
      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 h-full w-full"
            style={{ background: "hsl(var(--ai-ink) / 0.55)" }}
          />
          <div
            className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[85vw] flex-col overflow-y-auto border-r shadow-2xl"
            style={{
              background: "hsl(var(--ai-white))",
              borderColor: "hsl(var(--ai-stone-3))",
            }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-4"
              style={{ borderColor: "hsl(var(--ai-stone-3))" }}
            >
              <span className="text-sm font-semibold">{viewer.name}</span>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="ai-btn ai-btn-outline ai-btn-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav aria-label="Customer portal" className="space-y-5 p-3">
              {PORTAL_GROUPS.map((group) => (
                <div key={group.title}>
                  <p
                    className="px-3 pb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em]"
                    style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  >
                    {group.title}
                  </p>
                  <ul className="space-y-0.5">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <NavLink
                          link={link}
                          active={isActive(link, pathname)}
                          count={link.badge ? badges[link.badge] : 0}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      {/* ────────────────────────────────────────────────── phone bottom bar */}
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md lg:hidden"
        style={{
          borderColor: "hsl(var(--ai-stone-3))",
          background: "hsl(var(--ai-stone) / 0.94)",
          /* Clears the home indicator on a modern handset. */
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <ul className="flex">
          {phoneBar.map((link) => {
            const active = isActive(link, pathname);
            const count = link.badge ? badges[link.badge] : 0;
            const Icon = link.icon;
            return (
              <li key={link.href} className="flex-1">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="relative flex flex-col items-center gap-1 py-2.5 text-[0.66rem] font-semibold"
                  style={{
                    color: active
                      ? "hsl(var(--ai-emerald))"
                      : "hsl(var(--ai-charcoal-soft))",
                  }}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {count > 0 ? (
                      <span
                        className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-bold leading-none text-white"
                        style={{ background: "hsl(var(--ai-copper-fill))" }}
                      >
                        {count > 9 ? "9+" : count}
                      </span>
                    ) : null}
                  </span>
                  {link.label.split(" ")[0]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function NavLink({
  link,
  active,
  count,
}: {
  link: (typeof PORTAL_LINKS)[number];
  active: boolean;
  count: number;
}) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className="flex items-center gap-2.5 rounded-[var(--ai-radius)] px-3 py-2 text-sm font-medium transition-colors"
      style={
        active
          ? {
              background: "hsl(var(--ai-emerald) / 0.12)",
              color: "hsl(var(--ai-emerald))",
            }
          : { color: "hsl(var(--ai-charcoal-soft))" }
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{link.label}</span>
      {count > 0 ? (
        <span
          className="ai-num shrink-0 rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold leading-none text-white"
          style={{ background: "hsl(var(--ai-copper-fill))" }}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
