import { SiteBackdrop } from "@/components/brand/site-backdrop";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";

/**
 * The public shell.
 *
 * `.ai-site` is what switches on the entire brand layer — tokens, type and
 * primitives, all declared in app/brand.css. Nothing outside this subtree and
 * the customer portal gets them, which is how the staff app keeps its own look
 * without either side having to defend against the other.
 *
 * The header is sticky and overlaps the hero, so there is no top padding here;
 * a page that needs clearance provides its own.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ai-site flex min-h-screen flex-col overflow-x-clip">
      <SiteBackdrop />
      <SiteHeader />
      <main className="relative flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
