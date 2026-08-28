/**
 * Downscale the captured screenshots into print copies.
 *
 *   npx tsx scripts/capture-screens.mts      # 1. photograph the app
 *   node   scripts/optimise-screens.mjs      # 2. this
 *   npx tsx scripts/build-guides.mts         # 3. build the books
 *
 * WHY THIS STEP EXISTS. The guide books embed every screenshot as a data URI,
 * so a finished PDF is one file somebody can send over WhatsApp without it
 * losing its pictures. A raw capture is 2880x1800 and about a megabyte, and a
 * book with twenty of them is a twenty-megabyte HTML string that Chrome will
 * not finish parsing — the first attempt at this timed out at two minutes on
 * every document. The whole set downscaled is under six megabytes and a book
 * builds in seconds.
 *
 * The widths below are the widths the page actually renders them at, doubled,
 * so nothing is upscaled on paper and nothing is carried that print will
 * throw away.
 *
 * Uses sips, which ships with macOS, rather than adding an image dependency
 * for a step that runs once per capture.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "..", "docs", "screens");
const OUT = path.join(SRC, "print");

/* Rendered at ~118mm and ~42mm on an A4 page. These are those, at print density. */
const WIDTH = { desktop: 1400, phone: 460 };
const QUALITY = 86;

mkdirSync(OUT, { recursive: true });

const shots = readdirSync(SRC).filter((f) => f.endsWith(".png"));
let before = 0;
let after = 0;

for (const file of shots) {
  const mode = file.includes(".phone.") ? "phone" : "desktop";
  const out = path.join(OUT, file.replace(/\.png$/, ".jpg"));
  before += statSync(path.join(SRC, file)).size;

  execFileSync("sips", [
    "-s", "format", "jpeg",
    "-s", "formatOptions", String(QUALITY),
    "--resampleWidth", String(WIDTH[mode]),
    path.join(SRC, file),
    "--out", out,
  ], { stdio: "ignore" });

  after += statSync(out).size;
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(`${shots.length} print-sized images`);
console.log(`${mb(before)} MB  ->  ${mb(after)} MB`);
