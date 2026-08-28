import type { Metadata } from "next";
import Link from "next/link";

import { PasswordForm, ProfileForm } from "@/components/portal/profile-forms";
import { Field, Note, PageHead, Panel } from "@/components/portal/ui";
import { formatDateTime } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import { toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Profile — AITRANSIT" };

/**
 * The customer's own account.
 *
 * WHAT IS READ-ONLY HERE IS THE POINT OF THE PAGE. Name, primary phone, email,
 * customer code and every credit figure are shown but cannot be edited, and
 * each says who to speak to instead. The reasoning is in updateProfile in
 * lib/actions/portal-account.ts: the name is on invoices already issued and on
 * pickup notes the warehouse releases cargo against, and the primary phone is
 * how the counter identifies somebody. Letting either change silently makes a
 * customer's own documents disagree with their account.
 *
 * The sign-in history is read from LoginEvent, which the auth layer already
 * writes for every account — so this is real security history, not a page that
 * says "no recent activity" because nothing records it.
 */
export default async function ProfilePage() {
  const viewer = await requireCustomer();

  const [customer, logins] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: viewer.customerId },
      select: {
        name: true,
        code: true,
        phone: true,
        altPhone: true,
        email: true,
        city: true,
        address: true,
        createdAt: true,
        creditLimitUsd: true,
        creditTermDays: true,
        creditApprovedAt: true,
        notifyWhatsapp: true,
        notifyEmail: true,
        notifySms: true,
      },
    }),
    prisma.loginEvent.findMany({
      where: { userId: viewer.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, createdAt: true, ipAddress: true, ok: true },
    }),
  ]);

  if (!customer) return null;

  return (
    <div>
      <PageHead
        title="Profile & settings"
        lede="Your details, how we contact you, and your password."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ────────────────────────────────────────────────── what we hold */}
        <Panel title="Your account">
          <dl className="space-y-3">
            <Field label="Name">{customer.name}</Field>
            <Field label="Customer code">
              <span className="ai-num">{customer.code}</span>
            </Field>
            <Field label="Phone">
              <span className="ai-num">{customer.phone ?? "—"}</span>
            </Field>
            <Field label="Email">{viewer.email}</Field>
            <Field label="With us since">
              {formatDateTime(customer.createdAt)}
            </Field>
          </dl>

          <Note tone="neutral">
            Your name and main phone number are on invoices and pickup notes we
            have already issued, so we change them for you rather than letting
            them change quietly.{" "}
            <Link href="/portal/support" className="font-semibold underline">
              Send us a message
            </Link>{" "}
            and we will update them.
          </Note>
        </Panel>

        {/* ────────────────────────────────────────────────── what they edit */}
        <Panel title="Contact details">
          <ProfileForm
            customer={{
              altPhone: customer.altPhone,
              city: customer.city,
              address: customer.address,
              notifyWhatsapp: customer.notifyWhatsapp,
              notifyEmail: customer.notifyEmail,
              notifySms: customer.notifySms,
            }}
          />
        </Panel>

        {/* ───────────────────────────────────────────────────────── credit */}
        <Panel title="Your credit">
          {customer.creditLimitUsd === null ? (
            <p className="ai-muted text-sm">
              You do not have a credit facility. Credit lets you collect cargo
              before paying, within an agreed limit and an agreed number of days.
              Ask Finance if you would like one.
            </p>
          ) : (
            <dl className="space-y-3">
              <Field label="Limit">
                {formatUsd(toNumber(customer.creditLimitUsd))}
              </Field>
              <Field label="Terms">
                {customer.creditTermDays
                  ? `${customer.creditTermDays} days`
                  : "Agreed with Finance"}
              </Field>
              {customer.creditApprovedAt ? (
                <Field label="Approved">
                  {formatDateTime(customer.creditApprovedAt)}
                </Field>
              ) : null}
            </dl>
          )}
          <p className="ai-muted mt-3 text-xs">
            Only our finance desk can set or change a credit limit.
          </p>
        </Panel>

        {/* ─────────────────────────────────────────────────────── password */}
        <Panel title="Password">
          <PasswordForm />
        </Panel>
      </div>

      {/* ───────────────────────────────────────────────── security history */}
      <div className="mt-6">
        <Panel title="Recent sign-ins">
          {logins.length === 0 ? (
            <p className="ai-muted text-sm">
              Nothing recorded yet. Sign-ins from now on will show here.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "hsl(var(--ai-stone-3))" }}>
              {logins.map((login) => (
                <li
                  key={login.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <span className="ai-num">{formatDateTime(login.createdAt)}</span>
                  <span
                    className="text-xs"
                    style={{
                      color: login.ok
                        ? "hsl(var(--ai-charcoal-soft))"
                        : "hsl(348 70% 45%)",
                    }}
                  >
                    {login.ok ? "Signed in" : "Failed attempt"}
                    {login.ipAddress ? ` · ${login.ipAddress}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="ai-muted mt-3 text-xs">
            If you see a sign-in you do not recognise, change your password above
            and tell us straight away.
          </p>
        </Panel>
      </div>
    </div>
  );
}
