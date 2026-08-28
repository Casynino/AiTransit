import type { Metadata } from "next";
import { MapPinned, Paperclip } from "lucide-react";

import { BookVisitForm, ChangeBookingForm } from "@/components/portal/request-forms";
import { Empty, Note, PageHead, Pill, RecordRow } from "@/components/portal/ui";
import { formatDate } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { listAppointments } from "@/lib/portal-data";
import {
  APPOINTMENT_KIND,
  APPOINTMENT_LABEL,
  labelFor,
} from "@/lib/portal-labels";

export const metadata: Metadata = { title: "China visits — AITRANSIT" };

/**
 * Concierge bookings in China: markets, factories, suppliers.
 *
 * Shares the Appointment table with cargo pickups and is a separate page from
 * them, because they are separate errands: one is a trip to Makeni to fetch a
 * box, the other is a week in Guangzhou. Filtering by kind rather than splitting
 * the model keeps one queue for the desk that confirms both.
 */
export default async function VisitsPage() {
  const viewer = await requireCustomer();
  const appointments = await listAppointments(viewer.customerId);

  const visits = appointments.filter((a) => a.kind !== "CARGO_PICKUP");
  const upcoming = visits.filter(
    (a) => !["COMPLETED", "CANCELLED"].includes(a.status)
  );
  const past = visits.filter((a) => ["COMPLETED", "CANCELLED"].includes(a.status));

  return (
    <div>
      <PageHead
        title="Market & factory visits"
        lede="Coming to China? We will meet you, take you to the right market and interpret."
      />

      <div className="mb-8">
        <BookVisitForm defaultName={viewer.name} defaultPhone={viewer.phone ?? ""} />
      </div>

      <Note tone="neutral">
        Tell us as early as you can. Markets close on different days and the good
        factories need an appointment — a week's notice gets you a better trip
        than two days'.
      </Note>

      {visits.length === 0 ? (
        <div className="mt-6">
          <Empty
            icon={MapPinned}
            title="No visits booked"
            body="Whether you are sourcing for the first time or checking on a supplier you already use, our Guangzhou team will go with you."
          />
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
            Coming up
          </h2>
          <div className="space-y-3">
            {upcoming.map((appt) => {
              const meta = labelFor(APPOINTMENT_LABEL, appt.status);
              return (
                <div key={appt.id}>
                  <RecordRow
                    title={APPOINTMENT_KIND[appt.kind] ?? appt.kind}
                    subtitle={appt.locationName ?? appt.reference}
                    right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                    facts={[
                      { label: "Reference", value: appt.reference },
                      {
                        label: appt.confirmedFor ? "Confirmed for" : "You asked for",
                        value: formatDate(appt.confirmedFor ?? appt.preferredDate),
                      },
                      { label: "Visitors", value: String(appt.visitors) },
                      { label: "Contact", value: appt.contactName },
                    ]}
                  />

                  {appt.staffNote ? (
                    <div className="mt-2">
                      <Note tone="neutral" title="From our Guangzhou team">
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
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
            Past visits
          </h2>
          <div className="space-y-3">
            {past.map((appt) => {
              const meta = labelFor(APPOINTMENT_LABEL, appt.status);
              return (
                <RecordRow
                  key={appt.id}
                  title={APPOINTMENT_KIND[appt.kind] ?? appt.kind}
                  subtitle={appt.locationName ?? appt.reference}
                  right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                  facts={[
                    { label: "Reference", value: appt.reference },
                    {
                      label: "Date",
                      value: formatDate(appt.confirmedFor ?? appt.preferredDate),
                    },
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
