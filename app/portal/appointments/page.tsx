import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { BookPickupForm, ChangeBookingForm } from "@/components/portal/request-forms";
import { Empty, Note, PageHead, Panel, Pill, RecordRow } from "@/components/portal/ui";
import { formatDate } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { listAppointments, listCargo } from "@/lib/portal-data";
import { APPOINTMENT_LABEL, labelFor } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "Pickup appointments — AITRANSIT" };

/**
 * Booking a collection, and the history of past ones.
 *
 * THE FORM ONLY OFFERS COLLECTABLE CARGO. `readyForPickup` is the gate — the
 * same field the warehouse sets and the release desk reads — so the list a
 * customer chooses from is exactly the list the warehouse could actually hand
 * over. bookPickup re-checks it server-side; this is so nobody fills in a form
 * that was always going to be refused.
 *
 * Cargo released on approved credit is ready without being paid for, which is
 * why the gate is the cargo's own flag and not the invoice's status.
 */
export default async function AppointmentsPage() {
  const viewer = await requireCustomer();
  const [appointments, { rows }] = await Promise.all([
    listAppointments(viewer.customerId),
    listCargo(viewer.customerId, {}),
  ]);

  const pickups = appointments.filter((a) => a.kind === "CARGO_PICKUP");
  const collectable = rows.filter(
    (r) => r.readyForPickup !== null && r.deliveredAt === null
  );

  const upcoming = pickups.filter(
    (a) => !["COMPLETED", "CANCELLED"].includes(a.status)
  );
  const past = pickups.filter((a) => ["COMPLETED", "CANCELLED"].includes(a.status));

  return (
    <div>
      <PageHead
        title="Pickup appointments"
        lede="Tell us when you are coming so your cargo is ready at the counter."
      />

      <div className="mb-8">
        <BookPickupForm
          cargo={collectable.map((c) => ({
            id: c.id,
            trackingNumber: c.trackingNumber,
            description: c.description,
          }))}
          defaultName={viewer.name}
          defaultPhone={viewer.phone ?? ""}
        />
      </div>

      {collectable.length === 0 && pickups.length === 0 ? (
        <Empty
          icon={CalendarClock}
          title="Nothing to collect yet"
          body="Once cargo shows as ready to collect you can book a time here. We will notify you the moment it is."
          action={
            <Link href="/portal/cargo" className="ai-btn ai-btn-outline">
              See my cargo
            </Link>
          }
        />
      ) : null}

      {upcoming.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
            Coming up
          </h2>
          <div className="space-y-3">
            {upcoming.map((appt) => {
              const meta = labelFor(APPOINTMENT_LABEL, appt.status);
              return (
                <div key={appt.id}>
                  <RecordRow
                    title={
                      <span className="ai-num">
                        {appt.shipment?.trackingNumber ?? appt.reference}
                      </span>
                    }
                    subtitle={`Booking ${appt.reference}`}
                    right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                    facts={[
                      {
                        label: appt.confirmedFor ? "Confirmed for" : "You asked for",
                        value: `${formatDate(appt.confirmedFor ?? appt.preferredDate)}${
                          appt.preferredTime ? ` · ${appt.preferredTime}` : ""
                        }`,
                      },
                      { label: "Collector", value: appt.contactName },
                      { label: "Phone", value: appt.contactPhone },
                    ]}
                  />

                  {appt.staffNote ? (
                    <div className="mt-2">
                      <Note tone="neutral" title="From our warehouse">
                        {appt.staffNote}
                      </Note>
                    </div>
                  ) : null}

                  <div className="mt-2">
                    <ChangeBookingForm
                      appointmentId={appt.id}
                      reference={appt.reference}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
            Past bookings
          </h2>
          <div className="space-y-3">
            {past.map((appt) => {
              const meta = labelFor(APPOINTMENT_LABEL, appt.status);
              return (
                <RecordRow
                  key={appt.id}
                  title={
                    <span className="ai-num">
                      {appt.shipment?.trackingNumber ?? appt.reference}
                    </span>
                  }
                  subtitle={`Booking ${appt.reference}`}
                  right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                  facts={[
                    {
                      label: "Date",
                      value: formatDate(appt.confirmedFor ?? appt.preferredDate),
                    },
                    { label: "Collector", value: appt.contactName },
                  ]}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
