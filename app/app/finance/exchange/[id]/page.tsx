import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Paperclip } from "lucide-react";

import { ExchangeDecision } from "@/components/app/exchange-decision";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { activeAccounts } from "@/lib/accounts";
import {
  EXCHANGE_STATUS_LABELS,
  EXCHANGE_STATUS_TONE,
  EXCHANGE_TERMINAL_STATUSES,
  EXCHANGE_TYPE_LABELS,
  exchangeRequestById,
} from "@/lib/exchange";
import { formatDateTime, toNumber } from "@/lib/format";
import { t } from "@/lib/i18n";
import { can } from "@/lib/rbac";
import { requirePermission } from "@/lib/session";
import { viewerLocale } from "@/lib/viewer";

export const metadata: Metadata = { title: "Money request" };

/**
 * One request, everything about it, and the two controls that move it.
 *
 * The customer's own words and their attachment are shown verbatim and are never
 * edited — a request is evidence of what somebody asked for, and correcting it
 * would destroy the only record of the original ask. What the desk decides is
 * written into its own fields beside it.
 */
export default async function ExchangeRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("fx.manage");
  const { id } = await params;
  const locale = await viewerLocale();

  const [request, accounts] = await Promise.all([
    exchangeRequestById(id),
    activeAccounts(),
  ]);
  if (!request) notFound();

  const closed = (EXCHANGE_TERMINAL_STATUSES as readonly string[]).includes(
    request.status
  );

  const money = (value: number, currency: string) =>
    `${currency} ${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <>
      <Link
        href="/app/finance/exchange"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t(locale, "Money desk")}
      </Link>

      <PageHeader
        title={request.reference}
        description={t(locale, EXCHANGE_TYPE_LABELS[request.type])}
        actions={
          <Badge variant={EXCHANGE_STATUS_TONE[request.status]}>
            {t(locale, EXCHANGE_STATUS_LABELS[request.status])}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-display text-base font-semibold">
              {t(locale, "What was asked for")}
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Fact label={t(locale, "Amount")}>
                {money(toNumber(request.amount), request.fromCurrency)}
              </Fact>
              <Fact label={t(locale, "Wants")}>{request.toCurrency}</Fact>
              <Fact label={t(locale, "Submitted")}>
                {formatDateTime(request.createdAt)}
              </Fact>
              <Fact label={t(locale, "Contact")}>{request.contactName}</Fact>
              <Fact label={t(locale, "Phone")}>{request.contactPhone}</Fact>
              <Fact label={t(locale, "Email")}>{request.contactEmail ?? "—"}</Fact>
              <Fact label={t(locale, "Pays us by")}>
                {request.preferredMethod ?? "—"}
              </Fact>
              <Fact label={t(locale, "Purpose")}>{request.purpose ?? "—"}</Fact>
              <Fact label={t(locale, "Customer")}>
                {request.customer ? (
                  <Link
                    href={`/app/customers/${request.customer.id}`}
                    className="hover:underline"
                  >
                    {request.customer.name} ({request.customer.code})
                  </Link>
                ) : (
                  t(locale, "Not linked")
                )}
              </Fact>
            </dl>

            {request.notes ? (
              <p className="mt-4 rounded-lg border bg-muted/40 p-3 text-sm">
                {request.notes}
              </p>
            ) : null}
          </section>

          {request.recipientName ? (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="font-display text-base font-semibold">
                {t(locale, "Who the money goes to")}
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <Fact label={t(locale, "Recipient")}>
                  {request.recipientName}
                </Fact>
                <Fact label={t(locale, "Their contact")}>
                  {request.recipientContact ?? "—"}
                </Fact>
              </dl>
              {request.recipientDetails ? (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {t(locale, "Payment details, as the customer gave them")}
                  </p>
                  {/* Preserved exactly. A bank line retyped is a bank line
                      mistyped, and this is what the transfer is made against. */}
                  <pre className="mt-1 whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                    {request.recipientDetails}
                  </pre>
                </div>
              ) : null}
            </section>
          ) : null}

          {request.documentUrl || request.proofUrl ? (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="font-display text-base font-semibold">
                {t(locale, "Attachments")}
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {request.documentUrl ? (
                  <li>
                    <a
                      href={request.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:underline"
                    >
                      <Paperclip className="h-4 w-4" />
                      {request.documentName ??
                        t(locale, "Customer's document")}
                    </a>
                  </li>
                ) : null}
                {request.proofUrl ? (
                  <li>
                    <a
                      href={request.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      {request.proofName ?? t(locale, "Our transfer proof")}
                    </a>
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}

          {request.agreedRate !== null ||
          request.reviewedBy ||
          request.account ? (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="font-display text-base font-semibold">
                {t(locale, "What we agreed")}
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <Fact label={t(locale, "Agreed rate")}>
                  {request.agreedRate === null
                    ? "—"
                    : `1 ${request.fromCurrency} = ${request.toCurrency} ${toNumber(request.agreedRate).toLocaleString()}`}
                </Fact>
                <Fact label={t(locale, "They receive")}>
                  {request.agreedAmount === null
                    ? "—"
                    : money(toNumber(request.agreedAmount), request.toCurrency)}
                </Fact>
                <Fact label={t(locale, "Our fee")}>
                  {request.feeAmount === null
                    ? "—"
                    : money(toNumber(request.feeAmount), request.fromCurrency)}
                </Fact>
                <Fact label={t(locale, "Reviewed by")}>
                  {request.reviewedBy?.name ?? "—"}
                </Fact>
                <Fact label={t(locale, "Account")}>
                  {request.account
                    ? `${request.account.name} (${request.account.currency})`
                    : "—"}
                </Fact>
                <Fact label={t(locale, "Completed")}>
                  {request.completedAt
                    ? formatDateTime(request.completedAt)
                    : "—"}
                </Fact>
              </dl>
              {request.decisionNote ? (
                <p className="mt-4 rounded-lg border bg-muted/40 p-3 text-sm">
                  {request.decisionNote}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <div>
          <ExchangeDecision
            requestId={request.id}
            fromCurrency={request.fromCurrency}
            toCurrency={request.toCurrency}
            amount={toNumber(request.amount)}
            canComplete={can(user.role, "payment.record")}
            accounts={accounts}
            closed={closed}
          />
        </div>
      </div>
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
