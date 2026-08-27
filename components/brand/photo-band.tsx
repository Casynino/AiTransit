import { Photo } from "@/components/brand/photo";
import { Reveal } from "@/components/brand/motion";
import { Eyebrow, Wrap } from "@/components/brand/ui";
import { cn } from "@/lib/utils";

/*
  Two ways of putting a photograph into the run of a page.

  Both exist for the same reason: a long page made only of cards and copy goes
  flat about three screens in, whatever the typography is doing. A picture that
  breaks the column — either edge to edge, or half the row — resets the reader's
  eye and is most of the difference between a site that looks built and one that
  looks assembled from a template.
*/

/**
 * A photograph the full width of the viewport, with a line of copy on it.
 *
 * Use it as a hinge between two halves of a page, not as decoration. It is a
 * whole screen of attention and it should be spending it on something — the
 * route, the warehouse, the market floor.
 */
export function PhotoBand({
  src,
  alt = "",
  eyebrow,
  title,
  lede,
  children,
  height = "tall",
  align = "left",
}: {
  src: string;
  alt?: string;
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  height?: "tall" | "short";
  align?: "left" | "centre";
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Photo
          src={src}
          alt={alt}
          ratio="wide"
          width={2000}
          parallax={11}
          zoom={false}
          rounded="none"
          sizes="100vw"
          className="!aspect-auto h-full w-full"
        />
        {/* Two scrims, not one. The vertical pass makes any photograph dark
            enough to carry text; the horizontal pass keeps the side the text
            is on darker still, so a bright patch in the picture cannot land
            under a word. */}
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              align === "centre"
                ? "linear-gradient(to top, hsl(213 62% 6% / 0.86), hsl(213 62% 6% / 0.62))"
                : "linear-gradient(to right, hsl(213 62% 6% / 0.92) 0%, hsl(213 62% 6% / 0.72) 42%, hsl(213 62% 6% / 0.42) 100%)",
          }}
        />
      </div>

      <div
        className={cn(
          "ai-on-photo relative flex items-center",
          height === "tall"
            ? "min-h-[clamp(26rem,52vh,34rem)] py-24"
            : "min-h-[clamp(18rem,34vh,24rem)] py-16"
        )}
      >
        <Wrap>
          <div
            className={cn(
              "max-w-2xl",
              align === "centre" && "mx-auto text-center"
            )}
          >
            {eyebrow ? (
              <Reveal>
                <Eyebrow copper>{eyebrow}</Eyebrow>
              </Reveal>
            ) : null}
            <Reveal delay={60}>
              <h2 className="ai-display mt-4 text-balance">{title}</h2>
            </Reveal>
            {lede ? (
              <Reveal delay={120}>
                <p className="ai-lede mt-5">{lede}</p>
              </Reveal>
            ) : null}
            {children ? (
              <Reveal delay={180}>
                <div className="mt-8">{children}</div>
              </Reveal>
            ) : null}
          </div>
        </Wrap>
      </div>
    </section>
  );
}

/**
 * A photograph beside a block of copy, sides swappable.
 *
 * `flip` alternates the picture between left and right down a page. Two of
 * these in a row on the same side reads as a column with pictures in it;
 * alternating reads as a designed rhythm, and costs one prop.
 */
export function FeatureSplit({
  src,
  alt = "",
  eyebrow,
  title,
  children,
  points,
  flip,
  ratio = "landscape",
}: {
  src: string;
  alt?: string;
  eyebrow?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  points?: string[];
  flip?: boolean;
  ratio?: "landscape" | "portrait" | "wide" | "square";
}) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <Reveal className={cn(flip && "lg:order-2")}>
        <Photo
          src={src}
          alt={alt}
          ratio={ratio}
          width={1000}
          parallax
          sizes="(max-width: 1024px) 92vw, 46vw"
          className="shadow-[var(--ai-shadow-lg)]"
        />
      </Reveal>

      <div className={cn(flip && "lg:order-1")}>
        {eyebrow ? (
          <Reveal>
            <Eyebrow copper>{eyebrow}</Eyebrow>
          </Reveal>
        ) : null}
        <Reveal delay={60}>
          <h3 className="ai-display mt-4 text-balance">{title}</h3>
        </Reveal>
        {children ? (
          <Reveal delay={120}>
            <div className="ai-lede mt-5">{children}</div>
          </Reveal>
        ) : null}
        {points?.length ? (
          <Reveal delay={180}>
            <ul className="mt-8 space-y-4">
              {points.map((point) => (
                <li key={point} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "hsl(var(--ai-copper))" }}
                  />
                  <span
                    className="text-[0.95rem] leading-relaxed"
                    style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  >
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}
