"use client";

import { useActionState } from "react";
import { Check, CheckCheck } from "lucide-react";

import {
  readAllNotifications,
  readNotification,
} from "@/lib/actions/portal-account";

/**
 * Marking notifications read.
 *
 * TWO SEPARATE FORMS RATHER THAN ONE WITH A MODE, because "mark all read" is
 * the destructive one — it clears the sidebar badge in a single tap and there
 * is no undo — and it should not share a code path with a per-row tick that
 * clears exactly one thing.
 *
 * Neither takes an id from anywhere but the row it is rendered on, and both
 * actions re-scope to the signed-in user's own rows anyway.
 */
export function MarkRead({ id }: { id: string }) {
  const [, action] = useActionState(readNotification, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Mark as read"
        title="Mark as read"
        className="rounded-full p-1.5 transition-colors"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        <Check className="h-4 w-4" />
      </button>
    </form>
  );
}

export function MarkAllRead({ count }: { count: number }) {
  const [, action] = useActionState(
    async () => readAllNotifications(),
    undefined
  );

  if (count === 0) return null;

  return (
    <form action={action}>
      <button type="submit" className="ai-btn ai-btn-outline ai-btn-sm">
        <CheckCheck className="h-3.5 w-3.5" />
        Mark all read ({count})
      </button>
    </form>
  );
}
