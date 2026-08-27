import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin, Users } from "lucide-react";

import { Badge, Card, Eyebrow } from "@/components/brand/ui";
import {
  APPOINTMENT_LABELS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONE,
  customerAppointments,
} from "@/lib/appointments";
import { formatDate, toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";

export const metadata: Metadata = { title: "My bookings" };

/**
 * The customer's own diary.
 *
 * Shows the day they ASKED for and the day we CONFIRMED as two separate facts,
 * because until the second one is filled in the first is only a request — and a
 * portal that showed one date would be telling somebody an appointment exists
 * when it does not.
 */
export default async function PortalAppointmentsPage() {
  const viewer = await requireCustomer();
  const appointments = await customerAppointments(viewer.customerId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Appointments</Eyebrow>
          <h1 className="ai-display-lg mt-3">My bookings</h1>
          <p className="ai-muted mt-2">
            Cargo pickups, market days, supplier and factory visits.
          </p>
        </div>
        <Link href="/appointments" className="ai-btn ai-btn-primary">
          Book something
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <p className="ai-muted">
            Nothing booked. You can request a pickup slot at our Makeni
            warehouse, or a guided day in the China markets.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/appointments?service=CARGO_PICKUP"
              className="ai-btn ai-btn-outline ai-btn-sm"
            >
              Book a pickup
            </Link>
            <Link
              href="/appointments?service=MARKET_VISIT"
              className="ai-btn ai-btn-outline ai-btn-sm"
            >
              Book a market visit
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="ai-rows !p-0">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="ai-num text-sm">{appointment.reference}</p>
                  <p className="font-semibold">
                    {APPOINTMENT_LABELS[appointment.kind]}
                  </p>
                  {appointment.locationName ? (
                    <p className="ai-muted mt-1 flex items-center gap-1.5 text-sm">
                      <MapPin className="h-3.5 w-3.5" />
                      {appointment.locationName}
                    </p>
                  ) : null}
                  {appointment.shipment ? (
                    <p className="ai-muted mt-1 text-sm">
                      Cargo{" "}
                      <span className="ai-num">
                        {appointment.shipment.trackingNumber}
                      </span>
                    </p>
                  ) : null}
                </div>
                <Badge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
                  {APPOINTMENT_STATUS_LABELS[appointment.status]}
                </Badge>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="ai-muted text-[0.66rem] font-bold uppercase tracking-[0.13em]">
                    You asked for
                  </dt>
                  <dd className="mt-1 font-medium">
                    <CalendarClock className="mr-1.5 inline h-3.5 w-3.5" />
                    {formatDate(appointment.preferredDate)}
                    {appointment.preferredTime
                      ? ` · ${appointment.preferredTime}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="ai-muted text-[0.66rem] font-bold uppercase tracking-[0.13em]">
                    Confirmed for
                  </dt>
                  <dd
                    className="mt-1 font-medium"
                    style={{
                      color: appointment.confirmedFor
                        ? "hsl(var(--ai-emerald))"
                        : undefined,
                    }}
                  >
                    {appointment.confirmedFor
                      ? formatDate(appointment.confirmedFor)
                      : "Not yet"}
                  </dd>
                </div>
                {appointment.visitors > 1 ? (
                  <div>
                    <dt className="ai-muted text-[0.66rem] font-bold uppercase tracking-[0.13em]">
                      Visitors
                    </dt>
                    <dd className="mt-1 font-medium">
                      <Users className="mr-1.5 inline h-3.5 w-3.5" />
                      {appointment.visitors}
                    </dd>
                  </div>
                ) : null}
                {appointment.budgetUsd !== null ? (
                  <div>
                    <dt className="ai-muted text-[0.66rem] font-bold uppercase tracking-[0.13em]">
                      Budget
                    </dt>
                    <dd className="ai-num mt-1 font-medium">
                      USD {toNumber(appointment.budgetUsd).toLocaleString()}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {appointment.staffNote ? (
                <p className="ai-card mt-4 !p-3 text-sm">
                  <span className="ai-muted">From us: </span>
                  {appointment.staffNote}
                </p>
              ) : null}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
