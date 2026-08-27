"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";

import { submitBooking, submitPickup } from "@/lib/actions/requests";
import type { ActionResult } from "@/lib/actions/types";

/**
 * The two forms a customer fills in before any cargo exists.
 *
 * Deliberately short. Every extra field on a public form is a reason to close
 * the tab, and everything that actually matters — the real weight, the real
 * piece count, the price — is established when the boxes reach our counter in
 * Guangzhou. What is needed here is enough to ring the person back.
 *
 * Neither creates a shipment. A booking is a promise that cargo is coming; it
 * becomes a consignment when the boxes are physically on the counter and a
 * member of staff weighs them. Keeping that line sharp is what stops a form on
 * the internet from putting unchecked numbers into the operational record.
 */

function Done({
  reference,
  title,
  body,
}: {
  reference: string;
  title: string;
  body: string;
}) {
  return (
    <div className="ai-card text-center">
      <CheckCircle2
        className="mx-auto h-9 w-9"
        style={{ color: "hsl(var(--ai-emerald))" }}
      />
      <h3 className="ai-display mt-5">{title}</h3>
      <p
        className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        {body}
      </p>
      <p
        className="mt-7 inline-block rounded-[var(--ai-radius)] px-6 py-4"
        style={{ background: "hsl(var(--ai-emerald-soft))" }}
      >
        <span
          className="block text-[0.68rem] font-bold uppercase tracking-[0.18em]"
          style={{ color: "hsl(var(--ai-emerald))" }}
        >
          Your reference
        </span>
        <span className="ai-num mt-1.5 block text-xl font-semibold">
          {reference}
        </span>
      </p>
    </div>
  );
}

function Err({ state }: { state: ActionResult<unknown> | undefined }) {
  if (!state || state.ok) return null;
  return <p className="ai-notice ai-notice-error">{state.error}</p>;
}

export function BookingForm() {
  const [state, action] = useActionState(submitBooking, undefined);

  if (state?.ok && state.data) {
    return (
      <Done
        reference={state.data.reference}
        title="Booking received"
        body="We will contact you to confirm the details and tell you where to send your cargo. Nothing is charged until we have weighed it."
      />
    );
  }

  return (
    <form action={action} className="ai-card space-y-5">
      <Err state={state} />

      {/* Hidden from people, irresistible to bots. Not named "company" — this
          form asks for a real one. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="b-website">Website</label>
        <input id="b-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="b-name" className="ai-label">
            Your name
          </label>
          <input id="b-name" name="customerName" className="ai-field" required />
        </div>
        <div>
          <label htmlFor="b-phone" className="ai-label">
            Phone / WhatsApp
          </label>
          <input
            id="b-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+260 9…"
            className="ai-field"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="b-desc" className="ai-label">
          What are you sending?
        </label>
        <input
          id="b-desc"
          name="description"
          className="ai-field"
          placeholder="Hair bundles, phone cases, kitchen scales…"
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="b-cat" className="ai-label">
            Category
          </label>
          <select
            id="b-cat"
            name="cargoCategory"
            className="ai-field"
            defaultValue="NORMAL_GOODS"
          >
            <option value="NORMAL_GOODS">Normal goods</option>
            <option value="WIGS">Wigs</option>
            <option value="SPECIAL_CATEGORY">Special category</option>
          </select>
        </div>
        <div>
          <label htmlFor="b-weight" className="ai-label">
            Est. weight (kg)
          </label>
          <input
            id="b-weight"
            name="estimatedWeightKg"
            inputMode="decimal"
            className="ai-field ai-num"
          />
        </div>
        <div>
          <label htmlFor="b-pkgs" className="ai-label">
            Packages
          </label>
          <input
            id="b-pkgs"
            name="packages"
            inputMode="numeric"
            className="ai-field ai-num"
          />
        </div>
      </div>

      <div>
        <label htmlFor="b-notes" className="ai-label">
          Anything else
        </label>
        <textarea id="b-notes" name="notes" rows={3} className="ai-field" />
      </div>

      <button type="submit" className="ai-btn ai-btn-primary w-full">
        Book my cargo
      </button>

      <p className="ai-hint">
        This is a booking, not a shipment. Nothing is priced until your goods
        reach our Guangzhou counter and we weigh them.
      </p>
    </form>
  );
}

export function PickupForm() {
  const [state, action] = useActionState(submitPickup, undefined);

  if (state?.ok && state.data) {
    return (
      <Done
        reference={state.data.reference}
        title="Collection requested"
        body="Our Guangzhou team will contact your supplier and arrange the pickup. We will let you know once the goods are at our warehouse."
      />
    );
  }

  return (
    <form action={action} className="ai-card space-y-5">
      <Err state={state} />

      <div className="hidden" aria-hidden="true">
        <label htmlFor="p-website">Website</label>
        <input id="p-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="p-name" className="ai-label">
            Your name
          </label>
          <input id="p-name" name="customerName" className="ai-field" required />
        </div>
        <div>
          <label htmlFor="p-phone" className="ai-label">
            Phone / WhatsApp
          </label>
          <input
            id="p-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+260 9…"
            className="ai-field"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="p-address" className="ai-label">
          Supplier&rsquo;s address in China
        </label>
        <textarea
          id="p-address"
          name="address"
          rows={3}
          className="ai-field"
          required
          placeholder="Street, building, unit — exactly as your supplier gave it"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="p-city" className="ai-label">
            City / district
          </label>
          <input
            id="p-city"
            name="city"
            className="ai-field"
            required
            placeholder="Guangzhou"
          />
        </div>
        <div>
          <label htmlFor="p-maps" className="ai-label">
            Map link <span className="font-normal">(optional)</span>
          </label>
          <input id="p-maps" name="mapsUrl" className="ai-field" />
        </div>
      </div>

      <div>
        <label htmlFor="p-desc" className="ai-label">
          What are we collecting?
        </label>
        <input id="p-desc" name="description" className="ai-field" required />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="p-weight" className="ai-label">
            Est. weight (kg)
          </label>
          <input
            id="p-weight"
            name="estimatedWeightKg"
            inputMode="decimal"
            className="ai-field ai-num"
          />
        </div>
        <div>
          <label htmlFor="p-pkgs" className="ai-label">
            Packages
          </label>
          <input
            id="p-pkgs"
            name="packages"
            inputMode="numeric"
            className="ai-field ai-num"
          />
        </div>
      </div>

      <div>
        <label htmlFor="p-notes" className="ai-label">
          Anything else
        </label>
        <textarea id="p-notes" name="notes" rows={3} className="ai-field" />
      </div>

      <button type="submit" className="ai-btn ai-btn-primary w-full">
        Request collection
      </button>

      <p className="ai-hint">
        Collection from your supplier is free. We will confirm the address with
        them before sending anyone.
      </p>
    </form>
  );
}
