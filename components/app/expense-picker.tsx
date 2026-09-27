"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Anchor,
  ArrowLeft,
  ArrowLeftRight,
  Briefcase,
  ChevronRight,
  CircleDashed,
  Crown,
  Droplet,
  FileCheck,
  Fuel,
  GraduationCap,
  HandCoins,
  Heart,
  HeartHandshake,
  Landmark,
  Luggage,
  type LucideIcon,
  Megaphone,
  Package,
  Paperclip,
  Phone,
  Plane,
  Plug,
  Plus,
  Receipt,
  Search,
  Sparkles,
  Stamp,
  TrendingDown,
  Truck,
  User,
  Users,
  Wallet,
  Warehouse,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";

import { useT } from "@/components/app/locale-provider";
import {
  BATCH_COST_TYPES,
  CATEGORY_GROUP_OF,
  DRAW_TYPES,
  EXPENSE_CATEGORY_GROUPS,
  EXPENSE_CATEGORY_ICON,
  EXPENSE_CATEGORY_LABELS,
  STAFF_COST_TYPES,
} from "@/lib/expenses";

/**
 * Choosing WHAT was paid for, before being asked HOW MUCH.
 *
 * THE MODES ARE THE IDEA. A business does not record one kind of cost, it
 * records four, and each is a different QUESTION with a different first answer:
 *
 *   The office    what was it        -> pick a category
 *   A flight      which flight       -> pick the batch, then what it cost
 *   Staff         who was paid       -> pick the person, then what it was
 *   Executive     whose draw         -> pick the person, then what kind
 *
 * A single flat category list can express all four, and that is exactly its
 * problem: "Salaries" with no name on it, "Customs duty" with no flight against
 * it. Both get recorded, neither can be reconciled — a salary against no
 * payslip, a duty against no batch, so per-flight profit silently excludes the
 * biggest cost the flight had. Asking "which flight" FIRST makes attaching it
 * the default rather than an optional field further down the form that defaults
 * to "not one batch".
 *
 * THE LEFT RAIL IS WHATEVER THE MODE IS ABOUT. Categories in one, flights in
 * another, people in two. Each row carries a count, and in the flight mode the
 * ones with NOTHING recorded sort first — those are the ones somebody is
 * hunting for, because a flight with no costs on it is a flight whose profit is
 * wrong by the whole of what it cost to fly.
 *
 * NOTHING HERE IS LOCKED. Everything picked is editable on step two, and every
 * mode has a "something else" that takes free text.
 */

/* ----------------------------------------------------------------- icons */

const ICONS: Record<string, LucideIcon> = {
  plane: Plane,
  landmark: Landmark,
  fileCheck: FileCheck,
  truck: Truck,
  anchor: Anchor,
  stamp: Stamp,
  warehouse: Warehouse,
  users: Users,
  plug: Plug,
  phone: Phone,
  paperclip: Paperclip,
  megaphone: Megaphone,
  luggage: Luggage,
  briefcase: Briefcase,
  wrench: Wrench,
  heartHandshake: HeartHandshake,
  receipt: Receipt,
  fuel: Fuel,
  sparkles: Sparkles,
  wifi: Wifi,
  zap: Zap,
  droplet: Droplet,
  handCoins: HandCoins,
  heart: Heart,
  graduationCap: GraduationCap,
  arrowLeftRight: ArrowLeftRight,
  trendingDown: TrendingDown,
  crown: Crown,
  circleDashed: CircleDashed,
};

function iconFor(category: string): LucideIcon {
  return ICONS[EXPENSE_CATEGORY_ICON[category] ?? "circleDashed"] ?? CircleDashed;
}

/* ----------------------------------------------------------------- types */

export type PickerItem = { label: string; category: string; count?: number };

/** A flight a cost can be attached to, and how many it already has. */
export type PickerBatch = {
  id: string;
  label: string;
  /** "Loading · Guangzhou", "Arrived · Lusaka" — where it is. */
  note?: string | null;
  count: number;
};

/** Somebody who can be paid, or who can draw. */
export type PickerPerson = {
  id: string;
  name: string;
  role?: string | null;
  count: number;
  /**
   * May this person take a DRAW, as opposed to being paid a wage?
   *
   * Everybody appears under Staff; only the owner appears under Executive. A
   * warehouse clerk does not take a dividend, and offering them in that list is
   * how a salary gets recorded as a capital withdrawal and disappears out of
   * operating profit — which is precisely the mistake the Executive mode exists
   * to make hard.
   */
  executive?: boolean;
};

export type PickerChoice = {
  label: string;
  category: string;
  /** Set by the flight mode, so step two files it against the batch. */
  batchId?: string | null;
  batchLabel?: string | null;
  /** Set by the staff and executive modes — goes in "Paid to". */
  vendor?: string | null;
  /** The executive mode records non-operating; nothing else does. */
  expenseClass?: "OPERATING" | "NON_OPERATING";
};

type Mode = "office" | "flight" | "staff" | "executive";

const MODES: {
  key: Mode;
  tab: string;
  question: string;
  lede: string;
  placeholder: string;
}[] = [
  {
    key: "office",
    tab: "The office",
    question: "What did you pay for?",
    lede: "Search, or pick from a group. Anything new is saved for next time.",
    placeholder: "Search — rent, fuel, internet, bank charges…",
  },
  {
    key: "flight",
    tab: "A flight",
    question: "Which flight was it for?",
    lede: "Pick the flight, then what it cost. The ones with nothing recorded come first.",
    placeholder: "Search — customs, clearing, handling, transport…",
  },
  {
    key: "staff",
    tab: "Staff",
    question: "Who was paid?",
    lede: "Pick the person, then what it was for.",
    placeholder: "Search — salary, allowance, overtime, training…",
  },
  {
    key: "executive",
    tab: "Executive",
    question: "Whose draw is it?",
    lede: "Pick the person, see what they have drawn, then record the new one.",
    placeholder: "Search — drawings, dividend, advance…",
  },
];

export function ExpensePicker({
  usedMost,
  batches,
  people,
  onPick,
}: {
  usedMost: PickerItem[];
  batches: PickerBatch[];
  people: PickerPerson[];
  onPick: (choice: PickerChoice) => void;
}) {
  const t = useT();
  const [mode, setMode] = useState<Mode>("office");
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  /* A mode change is a new question. Carrying the old search or the old
     selection into it would answer a question nobody asked. */
  const switchTo = (next: Mode) => {
    setMode(next);
    setQuery("");
    setSel(null);
  };

  const meta = MODES.find((m) => m.key === mode)!;

  type Rail = {
    key: string;
    label: string;
    sub?: string | null;
    icon: LucideIcon;
    count: number;
    /** Drawn above this row, when the group changes. */
    heading?: string;
  };

  const rail: Rail[] = useMemo(() => {
    if (mode === "office") {
      return [
        ...(usedMost.length
          ? [
              {
                key: "used",
                label: t("Used most"),
                icon: Sparkles,
                count: usedMost.length,
              },
            ]
          : []),
        /* The office rail excludes the two categories that have a mode of
           their own — a flight cost belongs under A flight, where it can be
           attached to one. */
        ...EXPENSE_CATEGORY_GROUPS.filter(
          (g) => g.key !== "batch" && g.key !== "executive"
        )
          .flatMap((g) => g.categories)
          .filter((c) => !["SALARIES", "ALLOWANCE", "STAFF_WELFARE", "TRAINING"].includes(c))
          .map((c) => ({
            key: c,
            label: t(EXPENSE_CATEGORY_LABELS[c] ?? c),
            icon: iconFor(c),
            count: 0,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ];
    }

    if (mode === "flight") {
      /*
        NOTHING RECORDED FIRST. A flight with no costs against it is the one
        somebody is hunting for — its profit is currently wrong by the whole of
        what it cost to fly. Sorting by count puts the work at the top.
      */
      const sorted = [...batches].sort(
        (a, b) => a.count - b.count || a.label.localeCompare(b.label)
      );
      let marked = false;
      return sorted.map((b) => {
        const heading =
          b.count === 0 && !marked
            ? ((marked = true), t("Nothing recorded yet"))
            : undefined;
        return {
          key: b.id,
          label: b.label,
          sub: b.note ?? null,
          icon: Package,
          count: b.count,
          heading,
        };
      });
    }

    const who =
      mode === "executive" ? people.filter((p) => p.executive) : people;

    return who.map((p) => ({
      key: p.id,
      label: p.name,
      /* The role, unless it is the name again — several accounts are named
         after the desk they are ("Finance Office · Finance"). */
      sub:
        p.role && p.role.toLowerCase() !== p.name.toLowerCase() ? p.role : null,
      icon: User,
      count: p.count,
    }));
  }, [mode, usedMost, batches, people, t]);

  /* The first row is chosen for them; an empty right pane teaches nothing. */
  const active = sel ?? rail[0]?.key ?? null;
  const activeRow = rail.find((r) => r.key === active) ?? null;

  type Row = { label: string; sub: string; choice: PickerChoice; icon: LucideIcon };

  const rows: Row[] = useMemo(() => {
    if (mode === "office") {
      if (active === "used") {
        return usedMost.map((i) => ({
          label: i.label,
          sub:
            (EXPENSE_CATEGORY_LABELS[i.category] ?? "").toLowerCase() ===
            i.label.toLowerCase()
              ? t(CATEGORY_GROUP_OF[i.category] ?? "")
              : t(EXPENSE_CATEGORY_LABELS[i.category] ?? i.category),
          icon: iconFor(i.category),
          choice: { label: i.label, category: i.category },
        }));
      }
      const cat = active ?? "OTHER";
      const label = t(EXPENSE_CATEGORY_LABELS[cat] ?? cat);
      return [
        {
          label,
          sub: t(CATEGORY_GROUP_OF[cat] ?? ""),
          icon: iconFor(cat),
          choice: { label, category: cat },
        },
      ];
    }

    if (mode === "flight") {
      const batch = batches.find((b) => b.id === active);
      return BATCH_COST_TYPES.map((c) => ({
        label: t(c.label),
        sub: t(c.hint),
        icon: iconFor(c.category),
        choice: {
          label: t(c.label),
          category: c.category,
          batchId: batch?.id ?? null,
          batchLabel: batch?.label ?? null,
        },
      }));
    }

    const person = people.find((p) => p.id === active);

    if (mode === "staff") {
      return STAFF_COST_TYPES.map((c) => ({
        label: t(c.label),
        sub: t(c.hint),
        icon: iconFor(c.category),
        choice: {
          /* The person's name goes IN the description, because a ledger line
             reading "Salary" with the name only in a side field is a line
             nobody can reconcile from the register. */
          label: person ? `${t(c.label)} — ${person.name}` : t(c.label),
          category: c.category,
          vendor: person?.name ?? null,
        },
      }));
    }

    return DRAW_TYPES.map((d) => ({
      label: t(d.label),
      sub: t(d.hint),
      icon: Wallet,
      choice: {
        label: person ? `${t(d.label)} — ${person.name}` : t(d.label),
        category: "EXECUTIVE_DRAW",
        vendor: person?.name ?? null,
        /* Every draw is non-operating. See DRAW_TYPES in lib/expenses.ts. */
        expenseClass: "NON_OPERATING" as const,
      },
    }));
  }, [mode, active, usedMost, batches, people, t]);

  const searching = query.trim().length > 0;
  const shown = useMemo(() => {
    if (!searching) return rows;
    const q = query.trim().toLowerCase();

    /* In the office mode a search crosses every category, not only the one
       selected — that is the knowledge the rail exists to spare people. */
    const pool: Row[] =
      mode === "office"
        ? [
            ...usedMost.map((i) => ({
              label: i.label,
              sub: t(EXPENSE_CATEGORY_LABELS[i.category] ?? i.category),
              icon: iconFor(i.category),
              choice: { label: i.label, category: i.category },
            })),
            ...Object.keys(EXPENSE_CATEGORY_LABELS)
              .filter((c) => c !== "WIGS")
              .map((c) => {
                const label = t(EXPENSE_CATEGORY_LABELS[c]!);
                return {
                  label,
                  sub: t(CATEGORY_GROUP_OF[c] ?? ""),
                  icon: iconFor(c),
                  choice: { label, category: c },
                };
              }),
          ]
        : rows;

    const seen = new Set<string>();
    return pool.filter((r) => {
      if (!`${r.label} ${r.sub}`.toLowerCase().includes(q)) return false;
      const key = r.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [searching, query, rows, mode, usedMost, t]);

  const paneHeading = searching
    ? `${shown.length} ${shown.length === 1 ? t("match") : t("matches")}`
    : mode === "office"
      ? (activeRow?.label ?? "")
      : mode === "flight"
        ? `${activeRow?.label ?? ""}${activeRow?.sub ? ` · ${activeRow.sub}` : ""}`
        : `${activeRow?.label ?? ""}${
            activeRow?.count === 0
              ? ` · ${mode === "executive" ? t("nothing drawn yet") : t("nothing recorded yet")}`
              : ""
          }`;

  const elseLabel = query.trim()
    ? `${t("Record")} “${query.trim()}”`
    : mode === "flight"
      ? `${t("Something else on")} ${activeRow?.label ?? ""}`
      : mode === "staff"
        ? `${t("Something else for")} ${activeRow?.label ?? ""}`
        : mode === "executive"
          ? t("Something else — a new draw")
          : t("Something else — type it yourself");

  const elseChoice = (): PickerChoice => {
    const label = query.trim();
    if (mode === "flight") {
      const batch = batches.find((b) => b.id === active);
      return {
        label,
        category: "OTHER",
        batchId: batch?.id ?? null,
        batchLabel: batch?.label ?? null,
      };
    }
    const person = people.find((p) => p.id === active);
    if (mode === "staff") {
      return { label, category: "OTHER", vendor: person?.name ?? null };
    }
    if (mode === "executive") {
      return {
        label,
        category: "EXECUTIVE_DRAW",
        vendor: person?.name ?? null,
        expenseClass: "NON_OPERATING",
      };
    }
    return { label, category: "OTHER" };
  };

  const emptyRail =
    (mode === "flight" && batches.length === 0) ||
    (mode === "staff" && people.length === 0) ||
    (mode === "executive" && people.filter((p) => p.executive).length === 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-6 pb-4 pt-1">
        <h2 className="font-display text-xl font-semibold">{t(meta.question)}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t(meta.lede)}</p>

        <div
          role="tablist"
          aria-label={t("What kind of cost")}
          className="mt-4 flex gap-1.5 overflow-x-auto pb-0.5"
        >
          {MODES.map((m) => {
            const on = m.key === mode;
            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => switchTo(m.key)}
                className={`focus-ring shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  on
                    ? "border-brand bg-brand/10 text-brand"
                    : "text-muted-foreground hover:bg-accent/60"
                }`}
              >
                {t(m.tab)}
              </button>
            );
          })}
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(meta.placeholder)}
            aria-label={t("Search")}
            className="focus-ring h-12 w-full rounded-xl border bg-card pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-px overflow-hidden border-y bg-border sm:grid sm:grid-cols-[14.5rem_1fr]">
        <nav
          aria-label={t("Choose")}
          className={`flex shrink-0 gap-1.5 overflow-x-auto bg-card p-2 sm:min-h-0 sm:flex-col sm:gap-0 sm:overflow-x-visible sm:overflow-y-auto ${
            searching ? "hidden sm:flex sm:pointer-events-none sm:opacity-40" : ""
          }`}
        >
          {emptyRail ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              {mode === "flight"
                ? t("No open flights to attach a cost to.")
                : mode === "executive"
                  ? t("Only the owner's account can record a draw.")
                  : t("No staff accounts yet.")}
            </p>
          ) : null}

          {rail.map((r) => {
            const on = !searching && r.key === active;
            const Icon = r.icon;
            return (
              <div key={r.key} className="contents sm:block">
                {r.heading ? (
                  <p className="hidden px-3 pb-1 pt-3 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:block">
                    {r.heading}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSel(r.key)}
                  aria-current={on ? "true" : undefined}
                  className={`focus-ring flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors sm:w-full sm:shrink sm:whitespace-normal sm:rounded-lg sm:border-0 sm:px-3 sm:py-2.5 sm:text-left ${
                    on
                      ? "border-brand bg-accent font-semibold sm:border-0"
                      : "hover:bg-accent/60"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 sm:flex-1">
                    <span className="block truncate">{r.label}</span>
                    {r.sub ? (
                      <span className="hidden truncate text-xs text-muted-foreground sm:block">
                        {r.sub}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {r.count}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="flex min-h-0 flex-col bg-card">
          <p className="truncate border-b px-5 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {paneHeading}
          </p>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {shown.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                {t("Nothing matches. Use the line below.")}
              </p>
            ) : (
              <ul>
                {shown.map((row) => {
                  const Icon = row.icon;
                  /*
                    "Not recorded on this flight yet" is AMBER, not grey.

                    On a flight with nothing against it the second line is not a
                    label, it is a STATE, and that state is the reason somebody
                    opened this dialog: a missing customs duty is a flight whose
                    profit is wrong. Grey would file it under decoration.
                  */
                  const missing = mode === "flight" && activeRow?.count === 0;
                  return (
                    <li key={`${row.label}|${row.choice.category}`}>
                      <button
                        type="button"
                        onClick={() => onPick(row.choice)}
                        className="focus-ring flex w-full items-center gap-3 border-b px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-accent/60"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <Icon className="h-[1.1rem] w-[1.1rem]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {row.label}
                          </span>
                          {row.sub ? (
                            <span
                              className={`block truncate text-xs ${
                                missing ? "text-warning" : "text-muted-foreground"
                              }`}
                            >
                              {missing
                                ? t("Not recorded on this flight yet")
                                : row.sub}
                            </span>
                          ) : null}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onPick(elseChoice())}
        className="focus-ring flex w-full items-center gap-2.5 px-6 py-4 text-left text-sm font-medium hover:bg-accent/60"
      >
        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{elseLabel}</span>
      </button>
    </div>
  );
}

/** The chosen cost, shown at the top of step two with a way back. */
export function PickedCost({
  choice,
  onBack,
}: {
  choice: PickerChoice;
  onBack: () => void;
}) {
  const t = useT();
  const Icon =
    choice.category === "EXECUTIVE_DRAW" ? Wallet : iconFor(choice.category);

  const cat = t(EXPENSE_CATEGORY_LABELS[choice.category] ?? choice.category);
  /* The flight is the more useful second line when there is one: it was chosen
     first, and it is the thing that can be got wrong. */
  const sub = choice.batchLabel
    ? `${cat} · ${choice.batchLabel}`
    : cat.toLowerCase() === choice.label.toLowerCase()
      ? t(CATEGORY_GROUP_OF[choice.category] ?? cat)
      : cat;

  return (
    <button
      type="button"
      onClick={onBack}
      className="focus-ring flex w-full items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-accent/60"
    >
      <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
        <Icon className="h-[1.1rem] w-[1.1rem]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {choice.label || t("Something else")}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        {t("Change")}
      </span>
    </button>
  );
}
