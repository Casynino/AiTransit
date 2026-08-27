"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Factory,
  MessageSquare,
  PackageCheck,
  Search,
  Store,
  Users,
} from "lucide-react";

import { requestAppointment } from "@/lib/actions/appointments";
import type { ActionResult } from "@/lib/actions/types";

/**
 * The booking flow.
 *
 * ONE FORM, SEVEN SERVICES. Which fields appear is decided by the service
 * chosen at the top — a cargo pickup needs a tracking number and no interpreter;
 * a factory visit needs an address, a headcount and probably Mandarin. Building
 * seven forms would have meant seven places to fix the phone-number validation.
 *
 * WHAT IT PROMISES. Submitting produces a REQUEST and a reference, and the
 * confirmation says so in as many words. The server will not write any other
 * status, and the desk confirms the slot afterwards — so nobody travels to
 * Makeni on a day we never agreed.
 */

const SERVICES = [
  {
    value: "CARGO_PICKUP",
    label: "Collect my cargo",
    icon: PackageCheck,
    blurb: "Book a slot at our Makeni warehouse in Lusaka.",
  },
  {
    value: "MARKET_VISIT",
    label: "China market visit",
    icon: Store,
    blurb: "A day in the markets with a guide who speaks the language.",
  },
  {
    value: "SUPPLIER_VISIT",
    label: "Supplier visit",
    icon: Building2,
    blurb: "We meet your supplier with you, or on your behalf.",
  },
  {
    value: "FACTORY_VISIT",
    label: "Factory visit",
    icon: Factory,
    blurb: "See the production line, the samples and the terms.",
  },
  {
    value: "GOODS_INSPECTION",
    label: "Goods inspection",
    icon: ClipboardCheck,
    blurb: "We check your order before it is packed, and photograph it.",
  },
  {
    value: "SOURCING_HELP",
    label: "Sourcing help",
    icon: Search,
    blurb: "Tell us the product and we find and compare suppliers.",
  },
  {
    value: "CONSULTATION",
    label: "Talk it through",
    icon: MessageSquare,
    blurb: "Routes, costs, categories and paperwork, with a person.",
  },
] as const;

type ServiceValue = (typeof SERVICES)[number]["value"];

/** Which extra fields each service needs. */
const NEEDS = {
  cargo: new Set<ServiceValue>(["CARGO_PICKUP"]),
  location: new Set<ServiceValue>([
    "MARKET_VISIT",
    "SUPPLIER_VISIT",
    "FACTORY_VISIT",
    "GOODS_INSPECTION",
  ]),
  visitors: new Set<ServiceValue>([
    "MARKET_VISIT",
    "SUPPLIER_VISIT",
    "FACTORY_VISIT",
  ]),
  product: new Set<ServiceValue>([
    "MARKET_VISIT",
    "SUPPLIER_VISIT",
    "FACTORY_VISIT",
    "GOODS_INSPECTION",
    "SOURCING_HELP",
  ]),
  budget: new Set<ServiceValue>(["SOURCING_HELP"]),
};

function Done({
  reference,
  kind,
}: {
  reference: string;
  kind: string;
}) {
  const pickup = kind === "CARGO_PICKUP";
  return (
    <div className="ai-card text-center">
      <CalendarCheck
        className="mx-auto h-9 w-9"
        style={{ color: "hsl(var(--ai-emerald))" }}
      />
      <h3 className="ai-display mt-5">Booking requested</h3>
      <p className="ai-muted mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed">
        {pickup
          ? "We will check your cargo is ready and confirm the slot with you. Bring this reference to the counter."
          : "Our team will confirm the date and the details with you before anything is arranged."}
      </p>
      <p
        className="mt-7 inline-block rounded-[var(--ai-radius)] px-6 py-4"
        style={{ background: "hsl(var(--ai-emerald-soft))" }}
      >
        <span
          className="block text-[0.68rem] font-bold uppercase tracking-[0.18em]"
          style={{ color: "hsl(var(--ai-emerald))" }}
        >
          Booking reference
        </span>
        <span className="ai-num mt-1.5 block text-xl font-semibold">
          {reference}
        </span>
      </p>
      <p className="ai-muted mx-auto mt-6 max-w-sm text-xs leading-relaxed">
        This is a request, not a confirmed appointment. You will hear from us —
        and you can follow it in{" "}
        <Link href="/portal" className="ai-link">
          your portal
        </Link>{" "}
        if you have an account.
      </p>
    </div>
  );
}

export function BookingForm({
  defaultService = "CARGO_PICKUP",
  /** Pre-selects a market when the form is opened from a market card. */
  presetLocation,
  presetMarketSlug,
}: {
  defaultService?: ServiceValue;
  presetLocation?: string;
  presetMarketSlug?: string;
}) {
  const [state, action] = useActionState(requestAppointment, undefined);
  const [service, setService] = useState<ServiceValue>(defaultService);

  if (state?.ok && state.data) {
    return <Done reference={state.data.reference} kind={state.data.kind} />;
  }

  const chosen = SERVICES.find((s) => s.value === service);
  // The earliest day somebody can pick: today. The server checks it again.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="ai-card">
      <input type="hidden" name="kind" value={service} />
      {presetMarketSlug ? (
        <input type="hidden" name="marketSlug" value={presetMarketSlug} />
      ) : null}

      <fieldset>
        <legend className="ai-label mb-3">What can we help with?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SERVICES.map((s) => {
            const active = s.value === service;
            const Icon = s.icon;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setService(s.value)}
                aria-pressed={active}
                className="flex items-start gap-3 rounded-[var(--ai-radius)] border p-3.5 text-left transition-all"
                style={{
                  borderColor: active
                    ? "hsl(var(--ai-emerald))"
                    : "hsl(var(--ai-stone-3))",
                  background: active
                    ? "hsl(var(--ai-emerald-soft))"
                    : "hsl(var(--ai-white))",
                  boxShadow: active
                    ? "0 0 0 3px hsl(var(--ai-emerald)/0.12)"
                    : undefined,
                }}
              >
                <Icon
                  className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0"
                  style={{
                    color: active
                      ? "hsl(var(--ai-emerald))"
                      : "hsl(var(--ai-charcoal-soft))",
                  }}
                />
                <span className="text-[0.88rem] font-semibold leading-snug">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
        {chosen ? <p className="ai-hint">{chosen.blurb}</p> : null}
      </fieldset>

      <div className="mt-7 space-y-5">
        {state && !state.ok ? (
          <p className="ai-notice ai-notice-error">{state.error}</p>
        ) : null}

        {NEEDS.cargo.has(service) ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="bk-track" className="ai-label">
                Tracking number
              </label>
              <input
                id="bk-track"
                name="trackingNumber"
                className="ai-field ai-num uppercase"
                placeholder="AT-000123"
                required
              />
              <p className="ai-hint">
                We check your cargo is ready before confirming a slot.
              </p>
            </div>
            <div>
              <label htmlFor="bk-pkgs" className="ai-label">
                Packages <span className="font-normal">(if known)</span>
              </label>
              <input
                id="bk-pkgs"
                name="packages"
                inputMode="numeric"
                className="ai-field ai-num"
              />
            </div>
          </div>
        ) : null}

        {NEEDS.location.has(service) ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="bk-loc" className="ai-label">
                Market, supplier or factory
              </label>
              <input
                id="bk-loc"
                name="locationName"
                className="ai-field"
                defaultValue={presetLocation}
                placeholder="Yiwu International Trade City"
              />
            </div>
            <div>
              <label htmlFor="bk-addr" className="ai-label">
                Address <span className="font-normal">(if you have it)</span>
              </label>
              <input
                id="bk-addr"
                name="locationAddress"
                className="ai-field"
                placeholder="As your supplier gave it"
              />
            </div>
          </div>
        ) : null}

        {NEEDS.product.has(service) ? (
          <div>
            <label htmlFor="bk-product" className="ai-label">
              What are you buying or checking?
            </label>
            <input
              id="bk-product"
              name="productType"
              className="ai-field"
              placeholder="Hair bundles, phone accessories, kitchenware…"
            />
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="bk-date" className="ai-label">
              Preferred date
            </label>
            <input
              id="bk-date"
              name="preferredDate"
              type="date"
              min={today}
              defaultValue={today}
              className="ai-field"
              required
            />
          </div>
          <div>
            <label htmlFor="bk-time" className="ai-label">
              Preferred time
            </label>
            <select id="bk-time" name="preferredTime" className="ai-field">
              {["Morning", "Afternoon", "Any time"].map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        {NEEDS.visitors.has(service) ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="bk-visitors" className="ai-label">
                <Users className="mr-1.5 inline h-3.5 w-3.5" />
                How many people?
              </label>
              <input
                id="bk-visitors"
                name="visitors"
                inputMode="numeric"
                defaultValue={1}
                className="ai-field ai-num"
              />
            </div>
            <label className="flex items-end gap-2.5 pb-3.5">
              <input
                type="checkbox"
                name="needsInterpreter"
                className="h-4 w-4"
                style={{ accentColor: "hsl(var(--ai-emerald))" }}
              />
              <span className="text-sm font-medium">
                I need an interpreter / guide
              </span>
            </label>
          </div>
        ) : null}

        {NEEDS.budget.has(service) ? (
          <div>
            <label htmlFor="bk-budget" className="ai-label">
              Budget in USD <span className="font-normal">(optional)</span>
            </label>
            <input
              id="bk-budget"
              name="budgetUsd"
              inputMode="decimal"
              className="ai-field ai-num"
            />
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="bk-name" className="ai-label">
              Your name
            </label>
            <input id="bk-name" name="contactName" className="ai-field" required />
          </div>
          <div>
            <label htmlFor="bk-phone" className="ai-label">
              Phone / WhatsApp
            </label>
            <input
              id="bk-phone"
              name="contactPhone"
              type="tel"
              inputMode="tel"
              placeholder="+260 9…"
              className="ai-field"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="bk-email" className="ai-label">
            Email <span className="font-normal">(optional)</span>
          </label>
          <input id="bk-email" name="contactEmail" type="email" className="ai-field" />
        </div>

        <div>
          <label htmlFor="bk-notes" className="ai-label">
            Anything else we should know?
          </label>
          <textarea id="bk-notes" name="notes" rows={3} className="ai-field" />
        </div>

        <button type="submit" className="ai-btn ai-btn-primary w-full">
          Request this booking
        </button>

        <p className="ai-hint">
          This sends a request. Nothing is confirmed until our team agrees the
          date with you.
        </p>
      </div>
    </form>
  );
}
