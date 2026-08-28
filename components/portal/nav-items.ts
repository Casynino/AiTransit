import {
  BadgeAlert,
  Banknote,
  Bell,
  CalendarClock,
  Coins,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  MapPinned,
  MessageSquare,
  Package,
  Radar,
  Receipt,
  ScrollText,
  Store,
  UserCog,
} from "lucide-react";

/**
 * The portal's map, in one list.
 *
 * Shared by the desktop sidebar, the mobile drawer and the phone's bottom bar
 * so the three can never disagree about what exists or what it is called. A
 * navigation defined three times is a navigation with three different ideas of
 * where "Invoices" lives.
 *
 * GROUPED, because fourteen flat links is a wall. The grouping is by the
 * question somebody arrives with, not by our internal departments — a customer
 * does not know or care that pickup notes are issued by Finance and pickup
 * appointments are kept by the Lusaka warehouse.
 */
export type PortalLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match only this exact path — for the two section roots that have children. */
  exact?: boolean;
  /** Shown on the phone's bottom bar. Four, at most, or they stop being tappable. */
  primary?: boolean;
  /** Which counter, if any, puts a number on this link. */
  badge?: "unpaid" | "ready" | "openIssues" | "unread";
};

export type PortalGroup = { title: string; links: PortalLink[] };

export const PORTAL_GROUPS: PortalGroup[] = [
  {
    title: "Cargo",
    links: [
      {
        href: "/portal",
        label: "Overview",
        icon: LayoutDashboard,
        exact: true,
        primary: true,
      },
      {
        href: "/portal/cargo",
        label: "My cargo",
        icon: Package,
        primary: true,
        badge: "ready",
      },
      { href: "/portal/track", label: "Track cargo", icon: Radar, primary: true },
    ],
  },
  {
    title: "Money",
    links: [
      {
        href: "/portal/invoices",
        label: "Invoices & payments",
        icon: Receipt,
        primary: true,
        badge: "unpaid",
      },
      { href: "/portal/exchange", label: "Money exchange", icon: Coins },
      {
        href: "/portal/supplier-payments",
        label: "Supplier payments",
        icon: Banknote,
      },
    ],
  },
  {
    title: "Collection",
    links: [
      { href: "/portal/pickup-notes", label: "Pickup notes", icon: ScrollText },
      {
        href: "/portal/appointments",
        label: "Pickup appointments",
        icon: CalendarClock,
      },
    ],
  },
  {
    title: "China services",
    links: [
      { href: "/portal/china", label: "China services", icon: Store },
      { href: "/portal/visits", label: "Market & factory visits", icon: MapPinned },
    ],
  },
  {
    title: "Help",
    links: [
      {
        href: "/portal/claims",
        label: "Issues & claims",
        icon: BadgeAlert,
        badge: "openIssues",
      },
      { href: "/portal/support", label: "Support messages", icon: MessageSquare },
      {
        href: "/portal/notifications",
        label: "Notifications",
        icon: Bell,
        badge: "unread",
      },
      { href: "/portal/profile", label: "Profile & settings", icon: UserCog },
    ],
  },
];

/** Flat, for the phone bar and for anything that needs to resolve a path. */
export const PORTAL_LINKS: PortalLink[] = PORTAL_GROUPS.flatMap((g) => g.links);

/** The counts the sidebar puts on links. Zero is not shown; nobody needs a "0". */
export type PortalBadges = {
  unpaid: number;
  ready: number;
  openIssues: number;
  unread: number;
};

/**
 * Which link is on, for a given path.
 *
 * `exact` exists for /portal itself, which is a prefix of every other route and
 * would otherwise light up permanently. Everything else matches its own subtree,
 * so /portal/cargo/AT-000123 keeps "My cargo" lit.
 */
export function isActive(link: PortalLink, pathname: string) {
  return link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(`${link.href}/`);
}
