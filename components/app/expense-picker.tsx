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
  Users,
  Warehouse,
  Wifi,
  Wrench,
  Zap,
} from "lucide-react";

import { useT } from "@/components/app/locale-provider";
import {
  CATEGORY_GROUP_OF,
  EXPENSE_CATEGORY_GROUPS,
  EXPENSE_CATEGORY_ICON,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/expenses";

/**
 * Choosing WHAT was paid for, before being asked HOW MUCH.
 *
 * THE PROBLEM THIS SOLVES. Recording a cost used to be one panel with eight
 * fields, a row of quick chips and a thirty-one-item category dropdown. The
 * dropdown is the part that fails: nobody reads to the end of thirty-one
 * options, so the same electricity bill gets filed under Electricity by one
 * person, Utilities by another and Miscellaneous by a third — and the profit
 * and loss is then wrong in a way no total will reveal.
 *
 * Splitting it in two fixes that by asking one question at a time. "What did
 * you pay for?" is a question a person can answer from memory in a second;
 * "how much, from which account" is a question they answer with the receipt in
 * their hand. Mixing both on one screen means the category is chosen last,
 * hurriedly, from whatever is nearest in the list.
 *
 * WHAT IS ON THE LEFT AND WHY. The groups are the ones the business already
 * thinks in and the ones a profit and loss wants as headings — see
 * EXPENSE_CATEGORY_GROUPS. "Used most" sits above them and is built from what
 * this business has ACTUALLY recorded in the last six months, so within a few
 * weeks the first thing on screen is the thing most likely to be wanted. It is
 * data, not a guess: a picker whose shortcuts were chosen by a developer is a
 * picker whose shortcuts are wrong everywhere except the developer's head.
 *
 * NOTHING IS LOCKED. Everything picked here is still editable on step two, and
 * "Something else" takes a description nobody has used before. This removes
 * keystrokes and disagreement; it does not constrain what can be recorded.
 */

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

/** What a group's swatch is tinted with. Six, so no two adjacent rails match. */
const GROUP_TONE: Record<string, string> = {
  used: "text-brand bg-brand/10",
  batch: "text-info bg-info/10",
  office: "text-success bg-success/10",
  staff: "text-warning bg-warning/10",
  financial: "text-signal bg-signal/10",
  executive: "text-gold bg-gold/10",
  other: "text-muted-foreground bg-muted",
};

export type PickerItem = {
  /** What goes in the description field. */
  label: string;
  category: string;
  /** How many times this exact cost has been recorded in the last six months. */
  count?: number;
};

export type PickerChoice = { label: string; category: string };

export function ExpensePicker({
  /** Most-recorded first, from the last six months. May be empty on day one. */
  usedMost,
  onPick,
  onClose,
}: {
  usedMost: PickerItem[];
  onPick: (choice: PickerChoice) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>(usedMost.length ? "used" : "batch");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  /*
    Every category, as an item, once.

    The right-hand list is built from the CATEGORY list rather than from the
    template list, because the templates are a convenience layer over the same
    thirty-one categories and showing both would give two rows that record
    identically. What the templates contribute is the "used most" rail, which is
    real history rather than a second copy of the same names.
  */
  const groups = useMemo(
    () => [
      ...(usedMost.length
        ? [
            {
              key: "used",
              label: t("Used most"),
              hint: t("What this business actually pays for, most often first."),
              items: usedMost,
            },
          ]
        : []),
      ...EXPENSE_CATEGORY_GROUPS.map((g) => ({
        key: g.key,
        label: t(g.label),
        hint: t(g.hint),
        items: g.categories.map(
          (category): PickerItem => ({
            label: t(EXPENSE_CATEGORY_LABELS[category] ?? category),
            category,
          })
        ),
      })),
    ],
    [usedMost, t]
  );

  /*
    SEARCH CROSSES THE GROUPS. Somebody who types "water" should not have to
    know it lives under Office operations — that is precisely the knowledge the
    grouping exists to spare them.
  */
  const searching = query.trim().length > 0;
  const results = useMemo(() => {
    if (!searching) return [];
    const q = query.trim().toLowerCase();
    const seen = new Set<string>();
    const out: (PickerItem & { group: string })[] = [];
    for (const g of groups) {
      for (const item of g.items) {
        const key = `${item.label.toLowerCase()}|${item.category}`;
        if (seen.has(key)) continue;
        const hay = `${item.label} ${EXPENSE_CATEGORY_LABELS[item.category] ?? ""}`;
        if (!hay.toLowerCase().includes(q)) continue;
        seen.add(key);
        out.push({ ...item, group: g.key });
      }
    }
    return out;
  }, [groups, query, searching]);

  const active = groups.find((g) => g.key === group) ?? groups[0];
  const shown = searching ? results : (active?.items ?? []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── the question ──────────────────────────────────────────────────── */}
      <div className="px-6 pb-4 pt-1">
        <h2 className="font-display text-xl font-semibold">
          {t("What did you pay for?")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Search, or pick from a group. You can change any of it next.")}
        </p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search — customs, fuel, salary, internet…")}
            aria-label={t("Search expenses")}
            className="focus-ring h-12 w-full rounded-xl border bg-card pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* ── groups on the left, costs on the right ────────────────────────── */}
      {/*
        TWO COLUMNS ON A DESK, TWO ROWS ON A PHONE.

        Stacking the rail above the list at 390px gave each about a third of the
        height: four groups visible, two costs visible, both scrolling — which
        is worse than either alone. On a phone the rail becomes a horizontal
        strip of chips, the way tabs behave everywhere else, and the list gets
        all the height that is left.
      */}
      <div className="flex min-h-0 flex-1 flex-col gap-px overflow-hidden border-y bg-border sm:grid sm:grid-cols-[13.5rem_1fr]">
        {/*
          Hidden while searching. The rail answers "which part of the business",
          and a search has already crossed every part — leaving it visible with
          nothing selected reads as a control that has stopped working.
        */}
        <nav
          aria-label={t("Expense groups")}
          className={`flex shrink-0 gap-1.5 overflow-x-auto bg-card p-2 sm:min-h-0 sm:flex-col sm:gap-0 sm:overflow-x-visible sm:overflow-y-auto ${
            searching ? "hidden sm:flex sm:pointer-events-none sm:opacity-40" : ""
          }`}
        >
          {groups.map((g) => {
            const on = !searching && g.key === active?.key;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setGroup(g.key)}
                aria-current={on ? "true" : undefined}
                className={`focus-ring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors sm:w-full sm:shrink sm:whitespace-normal sm:rounded-lg sm:border-0 sm:px-3 sm:py-2.5 sm:text-left ${
                  on
                    ? "border-brand bg-accent font-semibold sm:border-0"
                    : "hover:bg-accent/60"
                }`}
              >
                <span className="min-w-0 sm:flex-1 sm:truncate">{g.label}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {g.items.length}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex min-h-0 flex-col bg-card">
          <p className="border-b px-5 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {searching
              ? `${results.length} ${results.length === 1 ? t("match") : t("matches")}`
              : (active?.label ?? "")}
          </p>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {shown.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                {t("Nothing matches. Use “Something else” below.")}
              </p>
            ) : (
              <ul>
                {shown.map((item) => {
                  const Icon = iconFor(item.category);
                  const tone =
                    GROUP_TONE[
                      ("group" in item ? (item as { group: string }).group : group) ??
                        "other"
                    ] ?? GROUP_TONE.other;
                  return (
                    <li key={`${item.label}|${item.category}`}>
                      <button
                        type="button"
                        onClick={() =>
                          onPick({ label: item.label, category: item.category })
                        }
                        className="focus-ring flex w-full items-center gap-3 border-b px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-accent/60"
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}
                        >
                          <Icon className="h-[1.1rem] w-[1.1rem]" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {item.label}
                          </span>
                          {/*
                            THE CATEGORY, UNLESS IT IS THE SAME WORD AGAIN.

                            A "used most" row is a real description somebody
                            typed, and most of the time they typed the category
                            name — so this read "Customs / Customs", twice, down
                            the whole list. Where they match, the GROUP is the
                            useful second line instead: it says which part of
                            the business the cost lands in, which is the thing
                            the row cannot otherwise tell you.
                          */}
                          {(() => {
                            const cat = t(
                              EXPENSE_CATEGORY_LABELS[item.category] ??
                                item.category
                            );
                            /*
                              THE SECOND LINE EARNS ITS PLACE OR IT IS NOT THERE.

                              Three cases, and each was wrong at some point:

                              - The description differs from the category, which
                                is the interesting case: "Selcom fee" under
                                "Bank charges". Show the category.
                              - They are the same word AND we are inside that
                                category's own group — the heading two rows up
                                already says "Office operations", so repeating
                                it on all eleven rows is noise. Show nothing.
                              - They are the same word and there is no heading
                                to lean on: "Used most", or search results that
                                cross the groups. Show the business group, which
                                is the one thing the row cannot otherwise say.
                            */
                            const same =
                              cat.toLowerCase() === item.label.toLowerCase();
                            const grouped = !searching && group !== "used";
                            if (same && grouped) return null;
                            return (
                              <span className="block truncate text-xs text-muted-foreground">
                                {same ? t(CATEGORY_GROUP_OF[item.category] ?? cat) : cat}
                              </span>
                            );
                          })()}
                        </span>

                        {/*
                          HOW OFTEN, NOT "MONTHLY".

                          A recurring badge would be a claim about a schedule
                          this system does not hold — nothing here knows that
                          the rent is monthly. The count is a fact: it is how
                          many times this exact cost has been recorded since
                          March, and it tells a clerk the same thing without
                          inventing anything.
                        */}
                        {item.count && item.count > 1 ? (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-semibold tabular-nums text-muted-foreground">
                            {item.count}×
                          </span>
                        ) : null}

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

      {/* ── the escape hatch ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() =>
          onPick({ label: query.trim(), category: "OTHER" })
        }
        className="focus-ring flex w-full items-center gap-2.5 px-6 py-4 text-left text-sm font-medium hover:bg-accent/60"
      >
        <Plus className="h-4 w-4 text-muted-foreground" />
        {query.trim()
          ? `${t("Record")} “${query.trim()}” — ${t("something else")}`
          : t("Something else — type it yourself")}
      </button>

      <span className="sr-only">
        <button type="button" onClick={onClose}>
          {t("Close")}
        </button>
      </span>
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
  const Icon = iconFor(choice.category);

  /* Same rule as the list rows: the category, unless that is the word already
     on the line above, in which case the business group says more. */
  const cat = t(EXPENSE_CATEGORY_LABELS[choice.category] ?? choice.category);
  const sub =
    cat.toLowerCase() === choice.label.toLowerCase()
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
        <span className="block truncate text-xs text-muted-foreground">
          {sub}
        </span>
      </span>
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        {t("Change")}
      </span>
    </button>
  );
}
