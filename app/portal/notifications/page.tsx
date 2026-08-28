import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";

import {
  MarkAllRead,
  MarkRead,
} from "@/components/portal/notification-actions";
import { Empty, Note, PageHead } from "@/components/portal/ui";
import { formatDateTime, formatRelative } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { listNotifications } from "@/lib/portal-data";

export const metadata: Metadata = { title: "Notifications — AITRANSIT" };

/**
 * Everything we have told this customer.
 *
 * IN-APP ONLY, AND THE PAGE SAYS SO. WhatsApp, email and SMS preferences exist
 * on the customer record and nothing in this codebase sends on those channels
 * yet. Rather than let the settings page imply otherwise, the note at the
 * bottom states plainly what runs today — see notifyCustomer in lib/notify.ts,
 * which deliberately does not consult the preferences for the same reason.
 *
 * Filtered by `userId` from the session, not by anything in the URL.
 */
export default async function NotificationsPage() {
  const viewer = await requireCustomer();
  const notifications = await listNotifications(viewer.userId);
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div>
      <PageHead
        title="Notifications"
        lede="Everything that has happened on your account, newest first."
        action={<MarkAllRead count={unread} />}
      />

      {notifications.length === 0 ? (
        <Empty
          icon={Bell}
          title="Nothing yet"
          body="We will tell you here when your cargo is received, dispatched, lands in Lusaka, is priced, is paid for and is ready to collect — and whenever one of your requests moves."
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const body = (
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${n.readAt ? "" : "font-semibold"}`}>
                  {n.title}
                </p>
                {n.body ? (
                  <p
                    className="mt-0.5 text-sm"
                    style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  >
                    {n.body}
                  </p>
                ) : null}
                <p
                  className="ai-num mt-1 text-xs"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  title={formatDateTime(n.createdAt)}
                >
                  {formatRelative(n.createdAt)}
                </p>
              </div>
            );

            return (
              <li
                key={n.id}
                className="flex items-start gap-3 rounded-[var(--ai-radius-lg)] border p-4"
                style={{
                  borderColor: n.readAt
                    ? "hsl(var(--ai-stone-3))"
                    : "hsl(var(--ai-emerald) / 0.35)",
                  background: n.readAt
                    ? "hsl(var(--ai-white))"
                    : "hsl(var(--ai-emerald) / 0.05)",
                }}
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: n.readAt
                      ? "hsl(var(--ai-stone-3))"
                      : "hsl(var(--ai-copper-fill))",
                  }}
                />

                {n.href ? (
                  <Link href={n.href} className="min-w-0 flex-1">
                    {body}
                  </Link>
                ) : (
                  body
                )}

                {n.readAt ? null : <MarkRead id={n.id} />}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8">
        <Note tone="neutral" title="How we contact you">
          These notifications appear here, in your portal. We also ring and
          WhatsApp you about anything urgent — that is a person, not this system.
          Automatic WhatsApp, email and SMS are not switched on yet; when they
          are, your{" "}
          <Link href="/portal/profile" className="font-semibold underline">
            contact preferences
          </Link>{" "}
          will decide what gets sent.
        </Note>
      </div>
    </div>
  );
}
