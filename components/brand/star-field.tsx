import { cn } from "@/lib/utils";

/**
 * The sky behind the page.
 *
 * NO JAVASCRIPT IN ANY OF IT. Every moving part is a CSS keyframe on `transform`
 * or `opacity`, both of which run on the compositor — so it holds frame rate on
 * the cheapest phone a customer might open the site on, and adds nothing to the
 * bundle somebody downloads before they can read a price.
 *
 * IT WORKS IN BOTH THEMES, and not by fading out in one of them. At night it is
 * what it looks like: white stars over deep navy, with the brand's emerald and
 * copper as distant nebulae. In daylight a starfield would be absurd, so the
 * same geometry is re-inked — the "stars" become faint navy specks at very low
 * opacity, reading as a fine paper texture rather than as space, and the
 * nebulae become the soft washes of colour a premium print piece has behind its
 * type. Same structure, same drift, two completely different impressions.
 *
 * Everything stops under prefers-reduced-motion — see `.ai-drift-*` in
 * app/brand.css.
 */
export function StarField({
  className,
  /**
   * "deep" is the full night sky, for hero bands that sit on ink.
   * "ambient" is the quiet version for long reading sections, where the
   * texture should be felt rather than noticed.
   */
  intensity = "deep",
}: {
  className?: string;
  intensity?: "deep" | "ambient";
}) {
  const ambient = intensity === "ambient";

  return (
    <div
      aria-hidden
      className={cn(
        "ai-sky pointer-events-none absolute inset-0 overflow-hidden",
        ambient && "ai-sky-ambient",
        className
      )}
    >
      {/* The nebulae. Two washes of brand colour, placed off-centre so they
          never sit behind the headline column. */}
      <div className="ai-sky-glow" />

      {/*
        Two plates of stars drifting at different speeds.

        Depth comes from the speed difference, not from the star sizes — the eye
        reads parallax long before it reads diameter, and two plates is enough
        to suggest it without a third repaint.
      */}
      <div className="ai-sky-stars ai-sky-stars-near" />
      <div className="ai-sky-stars ai-sky-stars-far" />

      {/* A single shooting star, on a long loop. Rare enough to be a small
          reward for anybody still looking, not a distraction. */}
      <span className="ai-sky-shot" />
    </div>
  );
}
