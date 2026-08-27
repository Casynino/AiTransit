import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Inbox, MapPin, Users } from "lucide-react";

import { AppointmentDecision } from "@/components/app/appointment-decision";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import {
  APPOINTMENT_LABELS,
  APPOINTMENT_OPEN_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONE,
  appointmentQueue,
} from "@/lib/appointments";
import { formatDate, formatRelative, toNumber } from "@/lib/format";
import { t } from "@/lib/i18n";
import { requirePermission } from "@/lib/session";
import { viewerLocale } from "@/lib/viewer";

export const metadata: Metadata = { title: "Appointments" };

/**
 * The diary.
 *
 * Cargo pickups at Makeni and concierge work in China, in one queue, ordered by
 * the day the customer asked for rather than by when they asked — the booking
 * that needs attention is the one happening on Thursday.
 *
 * Each row carries its own decision control rather than linking to a detail
 * page. Confirming a slot is a two-second job done twenty times a morning, and
 * a round trip through another screen for each is the difference between a tool
 * somebody uses and one they work around.
 */
export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("ticket.manage");
  const params = await searchParams;
  const locale = await viewerLocale();

  const showAll = params.status === "all";
  const appointments = await appointmentQueue({
    status: showAll ? undefined : "OPEN",
  });
  const open = appointments.filter((a) =>
    (APPOINTMENT_OPEN_STATUSES as readonly string[]).includes(a.status)
  ).length;

  return (
    <>
      <PageHeader
        title={t(locale, "Appointments")}
        description={t(
          locale,
          "Cargo pickups and concierge visits, soonest first. A booking is a request until somebody here confirms it."
        )}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/app/appointments"
          aria-current={showAll ? undefined : "page"}
          className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${
            showAll ? "bg-card" : "border-brand bg-brand text-brand-foreground"
          }`}
        >
          {t(locale, "Open")} ({open})
        </Link>
        <Link
          href="/app/appointments?status=all"
          aria-current={showAll ? "page" : undefined}
          className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${
            showAll ? "border-brand bg-brand text-brand-foreground" : "bg-card"
          }`}
        >
          {t(locale, "Everything")}
        </Link>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t(locale, "Nothing booked")}
          description={t(
            locale,
            "Pickup slots and visit requests from the website land here."
          )}
        />
      ) : (
        <ul className="space-y-4">
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className="grid gap-5 rounded-xl border bg-card p-5 lg:grid-cols-[1.3fr_1fr]"
            >
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm">{appointment.reference}</p>
                    <p className="font-display text-lg font-semibold">
                      {t(locale, APPOINTMENT_LABELS[appointment.kind])}
                    </p>
                  </div>
                  <Badge variant={APPOINTMENT_STATUS_TONE[appointment.status]}>
                    {t(locale, APPOINTMENT_STATUS_LABELS[appointment.status])}
                  </Badge>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <Fact label={t(locale, "Asked for")}>
                    <CalendarClock className="mr-1.5 inline h-3.5 w-3.5" />
                    {formatDate(appointment.preferredDate)}
                    {appointment.preferredTime
                      ? ` · ${appointment.preferredTime}`
                      : ""}
                  </Fact>
                  <Fact label={t(locale, "Confirmed for")}>
                    {appointment.confirmedFor
                      ? formatDate(appointment.confirmedFor)
                      : "—"}
                  </Fact>
                  <Fact label={t(locale, "Who")}>
                    {appointment.customer ? (
                      <Link
                        href={`/app/customers/${appointment.customer.id}`}
                        className="hover:underline"
                      >
                        {appointment.customer.name} ({appointment.customer.code})
                      </Link>
                    ) : (
                      appointment.contactName
                    )}
                  </Fact>
                  <Fact label={t(locale, "Phone")}>
                    {appointment.contactPhone}
                  </Fact>
                  {appointment.shipment ? (
                    <Fact label={t(locale, "Cargo")}>
                      <Link
                        href={`/app/cargo/${appointment.shipment.id}`}
                        className="font-mono hover:underline"
                      >
                        {appointment.shipment.trackingNumber}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {appointment.shipment.status.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </Fact>
                  ) : null}
                  {appointment.locationName ? (
                    <Fact label={t(locale, "Where")}>
                      <MapPin className="mr-1.5 inline h-3.5 w-3.5" />
                      {appointment.locationName}
                    </Fact>
                  ) : null}
                  {appointment.visitors > 1 ? (
                    <Fact label={t(locale, "Visitors")}>
                      <Users className="mr-1.5 inline h-3.5 w-3.5" />
                      {appointment.visitors}
                      {appointment.needsInterpreter
                        ? ` · ${t(locale, "interpreter needed")}`
                        : ""}
                    </Fact>
                  ) : null}
                  {appointment.budgetUsd !== null ? (
                    <Fact label={t(locale, "Budget")}>
                      USD {toNumber(appointment.budgetUsd).toLocaleString()}
                    </Fact>
                  ) : null}
                </dl>

                {appointment.locationAddress ? (
                  <p className="mt-4 rounded-lg border bg-muted/40 p-3 text-sm">
                    {appointment.locationAddress}
                  </p>
                ) : null}
                {appointment.notes ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {appointment.notes}
                  </p>
                ) : null}
                {appointment.staffNote ? (
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">
                      {t(locale, "Our note")}:{" "}
                    </span>
                    {appointment.staffNote}
                  </p>
                ) : null}

                <p className="mt-4 text-xs text-muted-foreground">
                  {t(locale, "Requested")} {formatRelative(appointment.createdAt)}
                  {appointment.handledBy
                    ? ` · ${t(locale, "handled by")} ${appointment.handledBy.name}`
                    : ""}
                </p>
              </div>

              <AppointmentDecision
                appointmentId={appointment.id}
                defaultDate={appointment.preferredDate.toISOString().slice(0, 10)}
                defaultTime={appointment.preferredTime}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{children}</dd>
    </div>
  );
}
