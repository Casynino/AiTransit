/**
 * The one seed entry point.
 *
 * `prisma db seed` runs its configured command WITHOUT A SHELL, so the obvious
 * `tsx a.ts && tsx b.ts` does not chain — the `&&` arrives as an argument to
 * the first script and the rest never run. That is how a fresh install ended up
 * with company accounts and staff but no cargo categories and no pricing rules
 * at all: the real rate tiers live in seed-pricing.ts, and nothing was calling
 * it. A deployment in that state cannot price a single consignment.
 *
 * So the chaining happens here, in Node, where it is explicit and fails loudly.
 *
 * ORDER MATTERS. Pricing first, because the rate book is what makes the system
 * able to quote; then the operational seed, which needs the categories to
 * exist; then the market directory, which is reference data and depends on
 * neither.
 *
 * Every step is idempotent — re-running is safe and is the normal case on a
 * redeploy.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* Each entry is [file, description, args]. seed-loading-tables defaults to a
   DRY RUN and writes nothing without --apply, which is why it appeared to run
   and left no loading table behind. */
const STEPS: readonly (readonly [string, string, readonly string[]])[] = [
  ["seed-pricing.ts", "Cargo categories and the rate book", []],
  ["seed-loading-tables.ts", "China loading tables", ["--apply"]],
  ["seed.ts", "Settings, accounts, FX board, staff (and demo cargo if enabled)", []],
  ["seed-markets.ts", "China market directory", []],
];

/* fileURLToPath, not `.pathname` — this repository lives under a directory
   with a space in its name, and the raw pathname percent-encodes it, so the
   child process was handed a path containing a literal "%20". */
const here = path.dirname(fileURLToPath(import.meta.url));

for (const [file, description, args] of STEPS) {
  console.log(`\n── ${description}`);
  execFileSync("npx", ["tsx", path.join(here, file), ...args], {
    stdio: "inherit",
    env: process.env,
  });
}

console.log("\nSeed complete.");
