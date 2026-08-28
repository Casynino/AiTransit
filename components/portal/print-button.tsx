"use client";

import { Printer } from "lucide-react";

/**
 * Print this page.
 *
 * A client component for one line, because the pickup note it sits on is a
 * server component and `window.print()` needs a browser. Worth the file: a
 * customer with no smartphone data at the counter prints the note at home, and
 * a button that looked like it printed but did not would be discovered at
 * exactly the wrong moment.
 */
export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="ai-btn ai-btn-outline w-full"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
