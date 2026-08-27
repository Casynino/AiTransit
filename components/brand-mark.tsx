import { EMBLEM_A, EMBLEM_ARROW, EMBLEM_VIEWBOX } from "@/components/brand-paths";
import { cn } from "@/lib/utils";

/**
 * AITRANSIT — the emblem.
 *
 * The letter A cut through by a forward arrow, in the company's two inks: navy
 * for the letter, cyan for the arrow.
 *
 * Painted with tokens rather than baked colours, and that is the whole reason
 * it is drawn in code. This mark spends most of its life on the navy sidebar,
 * where navy-on-navy would be a hole in the page — `text-brand` resolves to the
 * logo's own navy on a light surface and to a legible blue on a dark one, so a
 * single file works in both themes.
 *
 * The mark is wider than it is tall: the arrow leaves the letter on the right.
 * Size it by height (`h-9 w-auto`); a square box squashes it.
 */
export function BrandMark({
  className,
  style,
  tone = "theme",
}: {
  className?: string;
  /** For print, where the mark is sized in millimetres rather than in rems. */
  style?: React.CSSProperties;
  /**
   * "theme" follows the tokens, which is what the app chrome needs.
   *
   * "paper" pins the mark to the artwork's own inks. Printed documents are
   * white in either theme, so a token that brightens for the dark sidebar would
   * put pale blue on a page somebody is about to photocopy.
   */
  tone?: "theme" | "paper";
}) {
  const letter = tone === "paper" ? "fill-[#103B7C]" : "fill-brand";
  const arrow = tone === "paper" ? "fill-[#2BAEE6]" : "fill-info";

  return (
    <svg
      viewBox={EMBLEM_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-auto", className)}
      style={style}
      aria-hidden="true"
    >
      {/* even-odd so the counter inside the A is a hole, not a painted shape —
          it then takes the colour of whatever is behind the mark. */}
      <path d={EMBLEM_A} fillRule="evenodd" className={letter} />
      <path d={EMBLEM_ARROW} className={arrow} />
    </svg>
  );
}

/**
 * The mark with the name set beside it.
 *
 * Not a reproduction of the full artwork. In the real lockup "cargo" is set
 * small under a large AITRANSIT, and in a 64px sidebar header that second line
 * lands at about four pixels of letter — present, unreadable, and the kind of
 * detail that makes a product look like a scan of a business card. So the
 * emblem is artwork and the name is type, at a size a person can read.
 *
 * Colours follow the flyer: AI in navy, TRANSIT in cyan, "cargo" beneath.
 */
export function BrandLockup({
  className,
  subtitle = true,
}: {
  className?: string;
  subtitle?: boolean;
}) {
  return (
    // gap-2, not gap-2.5: the arrow leaves the emblem on the right, so the box
    // is already empty beside the words and reads as a wider gap than it
    // measures.
    <span className={cn("flex items-center gap-2", className)}>
      <BrandMark className="h-8 w-auto shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[16px] font-extrabold tracking-tight">
          <span className="text-brand">AI</span>
          <span className="text-info">TRANSIT</span>
        </span>
        {subtitle ? (
          /*
            Left in English on a Chinese screen, deliberately.

            This is not a description of the service, it is the second half of
            the wordmark — the company is called AITRANSIT Cargo, it is what the
            artwork says, and it is what is printed on the invoices and pickup
            notes customers already hold. Setting it as 空运快递 in the sidebar
            would make the app's logo disagree with the company's paperwork,
            which is worse than a Guangzhou clerk reading one familiar English
            word under a mark they see on every carton. Translate the interface;
            leave the name.
          */
          <span className="mt-1 text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground">
            Cargo
          </span>
        ) : null}
      </span>
    </span>
  );
}

/**
 * The full lockup, in its own colours, for the documents that leave the
 * building — an invoice, a pickup note, a manifest.
 *
 * Those print on white, so the inks need no token. Served as a file rather than
 * inlined because the print routes are the only things that want it and it
 * should not ride along in everybody's bundle.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // A plain img on purpose: next/image refuses SVG without
    // dangerouslyAllowSVG, and there is nothing here for it to optimise.
    <img
      src="/brand/aitransit-logo.svg"
      alt="AITRANSIT Cargo"
      className={cn("h-12 w-auto", className)}
    />
  );
}
