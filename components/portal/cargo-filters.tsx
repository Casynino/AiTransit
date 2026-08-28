"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Narrowing a cargo list, in the URL.
 *
 * THE URL IS THE STATE. Filters live in the query string, not in component
 * state, so a customer can bookmark "my cargo in transit", send that link to
 * their own phone, and press back without the list silently resetting. It also
 * means the overview's tiles are ordinary links — /portal/cargo?status=IN_TRANSIT
 * is a filter, not a special page.
 *
 * The search box is debounced. Typing a tracking number is eight keystrokes and
 * eight round trips to the database would be seven too many.
 */
export function CargoFilters({
  batches,
}: {
  batches: { batchNumber: string; origin: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "ALL") next.set(key, value);
    else next.delete(key);
    router.replace(`/portal/cargo?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const timer = setTimeout(() => set("q", q), 350);
    return () => clearTimeout(timer);
    // `set` and `params` are stable enough for this to key off the text alone;
    // adding them re-fires the debounce on every navigation it causes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const active =
    params.get("q") || params.get("status") || params.get("batch") ||
    params.get("from") || params.get("to");

  return (
    <div className="mb-6 space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tracking number, description or batch"
          aria-label="Search your cargo"
          className="w-full rounded-[var(--ai-radius)] border py-2.5 pl-10 pr-3 text-sm"
          style={{
            borderColor: "hsl(var(--ai-stone-3))",
            background: "hsl(var(--ai-white))",
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          label="Status"
          value={params.get("status") ?? "ALL"}
          onChange={(v) => set("status", v)}
          options={[
            ["ALL", "Every status"],
            ["READY_TO_DEPART", "In China"],
            ["IN_TRANSIT", "In transit"],
            ["RECEIVED_AT_ZAMBIA", "In Zambia"],
            ["READY_FOR_PICKUP", "Ready to collect"],
            ["DELIVERED", "Collected"],
            ["UNDER_INVESTIGATION", "Under investigation"],
          ]}
        />

        <Select
          label="Batch"
          value={params.get("batch") ?? "ALL"}
          onChange={(v) => set("batch", v)}
          options={[
            ["ALL", "Every batch"],
            ...batches.map(
              (b) => [b.batchNumber, b.batchNumber] as [string, string]
            ),
          ]}
        />

        <DateInput
          label="From"
          value={params.get("from") ?? ""}
          onChange={(v) => set("from", v)}
        />
        <DateInput
          label="To"
          value={params.get("to") ?? ""}
          onChange={(v) => set("to", v)}
        />

        {active ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              router.replace("/portal/cargo", { scroll: false });
            }}
            className="inline-flex items-center gap-1.5 rounded-[var(--ai-radius)] border px-3 py-2 text-sm font-medium"
            style={{ borderColor: "hsl(var(--ai-stone-3))" }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="rounded-[var(--ai-radius)] border px-3 py-2 text-sm"
        style={{
          borderColor: "hsl(var(--ai-stone-3))",
          background: "hsl(var(--ai-white))",
        }}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span style={{ color: "hsl(var(--ai-charcoal-soft))" }}>{label}</span>
      <input
        type="date"
        value={value}
        aria-label={`${label} date`}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[var(--ai-radius)] border px-3 py-2 text-sm"
        style={{
          borderColor: "hsl(var(--ai-stone-3))",
          background: "hsl(var(--ai-white))",
        }}
      />
    </label>
  );
}
