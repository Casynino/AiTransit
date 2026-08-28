"use client";

import { useActionState, useState } from "react";
import { Calendar, Coins, MapPinned, Package, Plus, Send, X } from "lucide-react";

import {
  CheckField,
  FileField,
  FormError,
  FormOk,
  SelectField,
  Submit,
  TextArea,
  TextField,
} from "@/components/portal/form";
import {
  bookExchange,
  bookPickup,
  bookVisit,
  changeAppointment,
  requestChinaService,
  requestSupplierPayment,
} from "@/lib/actions/portal-requests";
import { CHINA_SERVICES } from "@/lib/portal-labels";

/**
 * Every form a customer submits, in one file.
 *
 * THEY ARE ALL THE SAME SHAPE, on purpose: a button that opens a panel, fields,
 * one submit, and a confirmation that says what happens next rather than
 * "Success". Six differently-behaved request forms would be six things to
 * learn, and the thing being requested is the only part that should differ.
 *
 * EVERY CONFIRMATION NAMES THE NEXT HUMAN. "Sent to the money desk", "the
 * Guangzhou team will come back to you" — because the single most common
 * support call after a web form is somebody asking whether it went through.
 *
 * NONE OF THEM CLAIMS AN OUTCOME. The wording is "requested", never "booked";
 * "sent", never "approved". The actions behind them write rows in a
 * needs-a-decision status, and the copy has to agree with that or the portal is
 * promising things the desk has not agreed to.
 */

/* ---------------------------------------------------------------- shell */

function Disclosure({
  label,
  icon: Icon,
  children,
  open: controlledOpen,
}: {
  label: string;
  icon: typeof Plus;
  children: (close: () => void) => React.ReactNode;
  open?: boolean;
}) {
  const [open, setOpen] = useState(controlledOpen ?? false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ai-btn ai-btn-primary"
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    );
  }

  return (
    <section
      className="rounded-[var(--ai-radius-lg)] border p-5"
      style={{
        borderColor: "hsl(var(--ai-stone-3))",
        background: "hsl(var(--ai-white))",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{label}</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="ai-btn ai-btn-outline ai-btn-sm"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {children(() => setOpen(false))}
    </section>
  );
}

/* ------------------------------------------------------- 1. pickup booking */

export function BookPickupForm({
  cargo,
  defaultName,
  defaultPhone,
}: {
  cargo: { id: string; trackingNumber: string; description: string }[];
  defaultName: string;
  defaultPhone: string;
}) {
  const [state, action] = useActionState(bookPickup, undefined);

  /*
    No collectable cargo means no form. Offering one would produce a booking
    the warehouse must refuse, and the action refuses it anyway — better to say
    why here than to let somebody fill in a form for nothing.
  */
  if (cargo.length === 0) {
    return (
      <p className="ai-muted text-sm">
        You can book a pickup once cargo shows as ready to collect. We will
        notify you the moment it is.
      </p>
    );
  }

  return (
    <Disclosure label="Book a pickup" icon={Calendar}>
      {() => (
        <form action={action} className="space-y-4">
          {state?.ok ? (
            <FormOk>
              Requested. Our Lusaka warehouse will confirm the time — you will
              see it here and get a notification.
            </FormOk>
          ) : null}
          <FormError state={state} />

          <SelectField
            label="Which cargo?"
            name="shipmentId"
            required
            placeholder="Choose a consignment"
            options={cargo.map((c) => ({
              value: c.id,
              label: `${c.trackingNumber} — ${c.description}`,
            }))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Preferred date"
              name="preferredDate"
              type="date"
              required
            />
            <TextField
              label="Preferred time"
              name="preferredTime"
              placeholder="e.g. morning, or 14:00"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Who is collecting?"
              name="contactName"
              defaultValue={defaultName}
              required
              hint="The name on the ID they will bring."
            />
            <TextField
              label="Their phone number"
              name="contactPhone"
              defaultValue={defaultPhone}
              required
            />
          </div>

          <TextArea
            label="Anything we should know?"
            name="notes"
            rows={3}
            placeholder="A transporter is collecting, I need help loading, …"
          />

          <Submit pending="Requesting…">Request this pickup</Submit>
        </form>
      )}
    </Disclosure>
  );
}

/* --------------------------------------------------------- 2. china visits */

export function BookVisitForm({
  defaultName,
  defaultPhone,
}: {
  defaultName: string;
  defaultPhone: string;
}) {
  const [state, action] = useActionState(bookVisit, undefined);

  return (
    <Disclosure label="Book a visit" icon={MapPinned}>
      {() => (
        <form action={action} className="space-y-4">
          {state?.ok ? (
            <FormOk>
              Requested. Our Guangzhou team will confirm the day and who will
              meet you.
            </FormOk>
          ) : null}
          <FormError state={state} />

          <SelectField
            label="What kind of visit?"
            name="kind"
            required
            options={[
              { value: "MARKET_VISIT", label: "China market visit" },
              { value: "FACTORY_VISIT", label: "Factory visit" },
              { value: "SUPPLIER_VISIT", label: "Supplier visit" },
              { value: "GOODS_INSPECTION", label: "Goods inspection visit" },
              { value: "SOURCING_HELP", label: "Sourcing assistance" },
            ]}
          />

          <TextField
            label="Supplier, factory or market"
            name="locationName"
            required
            placeholder="e.g. Baiyun leather market"
          />
          <TextField
            label="Address"
            name="locationAddress"
            placeholder="If you have it — otherwise we will find it"
          />
          <TextField
            label="What are you buying?"
            name="productType"
            placeholder="e.g. handbags, phone accessories"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Preferred date" name="preferredDate" type="date" required />
            <TextField
              label="Preferred time"
              name="preferredTime"
              placeholder="e.g. morning"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="How many visitors?"
              name="visitors"
              type="number"
              min={1}
              max={20}
              defaultValue={1}
            />
            <TextField label="Budget (USD)" name="budgetUsd" placeholder="Optional" />
          </div>

          <CheckField
            label="I need an interpreter"
            name="needsInterpreter"
            hint="Our staff speak Mandarin and English."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Contact name"
              name="contactName"
              defaultValue={defaultName}
              required
            />
            <TextField
              label="Phone"
              name="contactPhone"
              defaultValue={defaultPhone}
              required
            />
          </div>

          <FileField
            label="Anything to send ahead?"
            name="document"
            hint="A product list or a photo of what you are after. Optional."
          />
          <TextArea label="Notes" name="notes" rows={3} />

          <Submit pending="Requesting…">Request this visit</Submit>
        </form>
      )}
    </Disclosure>
  );
}

/* ---------------------------------------------------- 3. supplier payment */

export function SupplierPaymentForm({
  cargo,
}: {
  cargo: { id: string; trackingNumber: string }[];
}) {
  const [state, action] = useActionState(requestSupplierPayment, undefined);

  return (
    <Disclosure label="Request a supplier payment" icon={Send}>
      {() => (
        <form action={action} className="space-y-4">
          {state?.ok ? (
            <FormOk>
              Sent to our money desk. They will check the details and come back
              to you with what to pay before anything is sent.
            </FormOk>
          ) : null}
          <FormError state={state} />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Supplier name" name="supplierName" required />
            <TextField
              label="Supplier phone or WeChat"
              name="supplierContact"
              placeholder="Optional but helpful"
            />
          </div>

          <TextArea
            label="Supplier payment details"
            name="recipientDetails"
            required
            rows={3}
            hint="Bank account, Alipay or WeChat — exactly as the supplier gave it to you."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Amount" name="amount" required placeholder="0.00" />
            <SelectField
              label="Currency"
              name="currency"
              required
              options={[
                { value: "CNY", label: "CNY — Chinese yuan" },
                { value: "USD", label: "USD — US dollars" },
              ]}
            />
          </div>

          <TextField
            label="What is it for?"
            name="purpose"
            required
            placeholder="e.g. balance on order #A2291, 40 cartons"
          />

          <SelectField
            label="Related cargo"
            name="shipmentId"
            placeholder="None"
            options={cargo.map((c) => ({
              value: c.id,
              label: c.trackingNumber,
            }))}
          />

          <FileField
            label="Order or invoice document"
            name="document"
            hint="The supplier's invoice or your order. Optional, but it speeds this up."
          />
          <TextArea label="Notes" name="notes" rows={3} />

          <Submit pending="Sending…">Send this request</Submit>
        </form>
      )}
    </Disclosure>
  );
}

/* ---------------------------------------------------- 4. money exchange */

export function ExchangeForm() {
  const [state, action] = useActionState(bookExchange, undefined);

  return (
    <Disclosure label="Book an exchange" icon={Coins}>
      {() => (
        <form action={action} className="space-y-4">
          {state?.ok ? (
            <FormOk>
              Sent. The money desk will confirm a rate with you before anything
              moves — nothing is fixed until you agree it.
            </FormOk>
          ) : null}
          <FormError state={state} />

          <SelectField
            label="What do you need?"
            name="type"
            required
            options={[
              { value: "MONEY_EXCHANGE", label: "Exchange money" },
              { value: "SEND_MONEY_CHINA", label: "Send money to China" },
              { value: "EXCHANGE_QUOTE", label: "Just a rate quote" },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              label="From"
              name="fromCurrency"
              required
              defaultValue="ZMW"
              options={[
                { value: "ZMW", label: "ZMW" },
                { value: "USD", label: "USD" },
                { value: "CNY", label: "CNY" },
              ]}
            />
            <SelectField
              label="To"
              name="toCurrency"
              required
              defaultValue="USD"
              options={[
                { value: "USD", label: "USD" },
                { value: "CNY", label: "CNY" },
                { value: "ZMW", label: "ZMW" },
              ]}
            />
            <TextField label="Amount" name="amount" required placeholder="0.00" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Who receives it?"
              name="recipientName"
              placeholder="Leave blank if it is for you"
            />
            <TextField label="Their phone or WeChat" name="recipientContact" />
          </div>

          <TextArea
            label="Their payment details"
            name="recipientDetails"
            rows={3}
            hint="Bank, Alipay or WeChat. Only needed if we are sending it on."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="What is it for?"
              name="purpose"
              placeholder="e.g. paying for goods"
            />
            <TextField
              label="How would you like to pay us?"
              name="preferredMethod"
              placeholder="e.g. Airtel Money, bank transfer, cash"
            />
          </div>

          <FileField label="Supporting document" name="document" />
          <TextArea label="Notes" name="notes" rows={3} />

          <Submit pending="Sending…">Send this booking</Submit>
        </form>
      )}
    </Disclosure>
  );
}

/* ---------------------------------------------------- 5. china services */

export function ChinaServiceForm({ preset }: { preset?: string }) {
  const [state, action] = useActionState(requestChinaService, undefined);
  const [type, setType] = useState(preset ?? "");

  const chosen = CHINA_SERVICES.find((s) => s.value === type);

  return (
    <Disclosure label="Request a service" icon={Package} open={Boolean(preset)}>
      {() => (
        <form action={action} className="space-y-4">
          {state?.ok ? (
            <FormOk>
              Sent to our Guangzhou team. They will pick it up and reply here.
            </FormOk>
          ) : null}
          <FormError state={state} />

          <SelectField
            label="Which service?"
            name="type"
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Choose a service"
            options={CHINA_SERVICES.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
          />

          {chosen ? (
            <p
              className="rounded-[var(--ai-radius)] px-3.5 py-2.5 text-sm"
              style={{ background: "hsl(var(--ai-stone-2))" }}
            >
              {chosen.blurb}
            </p>
          ) : null}

          <TextField
            label="What are the goods?"
            name="product"
            required
            placeholder="e.g. 200 pairs of shoes"
          />
          <TextField
            label="Supplier"
            name="supplier"
            placeholder="Name, shop or WeChat — if you have one"
          />
          <TextArea
            label="Tell us what you need"
            name="description"
            required
            rows={4}
          />
          <TextField label="Budget (USD)" name="budgetUsd" placeholder="Optional" />
          <FileField
            label="Photo or document"
            name="document"
            hint="A product photo, a quotation, a WeChat screenshot. Optional."
          />

          <Submit pending="Sending…">Send this request</Submit>
        </form>
      )}
    </Disclosure>
  );
}

/* --------------------------------------------- 6. change / cancel a booking */

export function ChangeBookingForm({
  appointmentId,
  reference,
}: {
  appointmentId: string;
  reference: string;
}) {
  const [state, action] = useActionState(changeAppointment, undefined);
  const [intent, setIntent] = useState<"RESCHEDULE" | "CANCEL">("RESCHEDULE");
  const [open, setOpen] = useState(false);

  if (state?.ok) {
    return (
      <FormOk>
        {intent === "CANCEL"
          ? `${reference} is cancelled.`
          : `We have your new date for ${reference} and will confirm it.`}
      </FormOk>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ai-btn ai-btn-outline ai-btn-sm"
      >
        Change or cancel
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <input type="hidden" name="intent" value={intent} />
      <FormError state={state} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIntent("RESCHEDULE")}
          className={`ai-btn ai-btn-sm ${intent === "RESCHEDULE" ? "ai-btn-primary" : "ai-btn-outline"}`}
        >
          Move it
        </button>
        <button
          type="button"
          onClick={() => setIntent("CANCEL")}
          className={`ai-btn ai-btn-sm ${intent === "CANCEL" ? "ai-btn-primary" : "ai-btn-outline"}`}
        >
          Cancel it
        </button>
      </div>

      {intent === "RESCHEDULE" ? (
        <TextField label="New date" name="preferredDate" type="date" required />
      ) : null}

      <TextArea
        label={intent === "CANCEL" ? "Why are you cancelling?" : "Why the change?"}
        name="reason"
        rows={2}
        required
      />

      <div className="flex gap-2">
        <Submit pending="Sending…">
          {intent === "CANCEL" ? "Cancel this booking" : "Request the new date"}
        </Submit>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ai-btn ai-btn-outline"
        >
          Never mind
        </button>
      </div>
    </form>
  );
}
