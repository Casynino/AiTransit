import { StarField } from "@/components/brand/star-field";

/**
 * The sky behind the WHOLE site, not just the banners.
 *
 * The heroes always had a starfield; everything under them was a flat slab of
 * colour, and on a long page in the dark theme that is four or five screens of
 * near-black with cards floating on it. It read as unfinished, which is fair,
 * because it was — the atmosphere stopped exactly where the photograph did.
 *
 * So the sky moves out of the hero and behind the entire page. One `fixed`
 * layer, painted once, that every section is then translucent over: scrolling
 * moves the content across a sky that stays put, which is the parallax you get
 * for free and the one that costs nothing.
 *
 * FIXED, not absolute, for a practical reason. A backdrop as tall as the
 * document would mean star plates several thousand pixels tall on the markets
 * page, and the browser compositing all of it. Pinning it to the viewport means
 * the sky is always exactly one screen, whatever the page length.
 *
 * It is not decoration only in the dark theme. In daylight the same geometry is
 * re-inked to faint specks and soft colour washes — see the note in StarField —
 * so the light page gets the texture of good paper rather than a flat fill.
 */
export function SiteBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* The page colour itself. Everything above is translucent over this, so
          text contrast is measured against this and nothing else. */}
      <div className="absolute inset-0 ai-backdrop-base" />

      {/* "deep", not "ambient". Ambient is tuned to sit directly under text;
          this sits under a translucent panel as well, and the two reductions
          multiply — at ambient strength the stars were arithmetically present
          and visually gone. */}
      <StarField intensity="deep" />

      {/* Two very slow colour drifts. Large, faint and far apart, so what the
          eye gets is a page that is never quite the same flat colour twice
          rather than anything it can point at and call an animation. */}
      <span className="ai-aurora ai-aurora-a" />
      <span className="ai-aurora ai-aurora-b" />
    </div>
  );
}
