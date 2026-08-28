import { redirect } from "next/navigation";

/**
 * "Requests" became "China services".
 *
 * The old page carried sourcing requests under a name that told a customer
 * nothing about what they could ask for. Kept as a redirect because links to it
 * exist in emails and in customers' own bookmarks, and a 404 on a page somebody
 * used last month reads as the portal having lost their requests.
 */
export default function RequestsPage() {
  redirect("/portal/china");
}
