/**
 * The AITRANSIT emblem, as vector paths.
 *
 * The mark is the letter A cut through by a forward arrow — the same shape that
 * appears on the company's flyers, drawn here rather than embedded as an image
 * so it can be PAINTED WITH TOKENS. That matters more than it sounds: the mark
 * spends most of its life on the navy sidebar, and navy artwork on a navy
 * surface is a hole in the page. Two paths, two tokens, one file that works in
 * both themes and on white paper.
 *
 * Wider than it is tall — the arrow leaves the A on the right. Size it by
 * height (`h-9 w-auto`); a square box squashes it.
 */
export const EMBLEM_VIEWBOX = "0 0 128 96";

/**
 * The A: two strokes meeting at an apex, with the crossbar left out.
 *
 * Deliberately open at the top rather than a solid triangle. The crossbar is
 * where the arrow passes through, and drawing both put two horizontal bars
 * within a few pixels of each other — at sidebar size that reads as a smudge
 * rather than a letter.
 */
export const EMBLEM_A =
  "M42.5 6 L57.5 6 L86 90 L68 90 L61.5 69 L33 69 L26.5 90 L8.5 90 Z " +
  "M38 54 L57 54 L47.5 23 Z";

/**
 * The arrow, sweeping up and out to the right through the letter.
 *
 * A single closed path: a tapering shaft with a head at the end. Drawn as one
 * shape rather than a stroked line with a marker so it scales cleanly and
 * carries a single fill.
 */
export const EMBLEM_ARROW =
  "M50 47 L104 47 L92 33 L112 33 L128 52 L112 71 L92 71 L104 57 L54 57 Z";
