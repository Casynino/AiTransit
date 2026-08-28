/**
 * Screenshot the running app for the department guide books.
 *
 *   npm run dev                                   # in another terminal
 *   npx tsx scripts/capture-screens.mts
 *
 * Signs in as each department in turn and photographs the pages that
 * department actually works, at desktop and phone width, into docs/screens/.
 *
 * HOW IT SIGNS IN, AND WHY NOT THROUGH THE FORM.
 *
 * It mints the session cookie directly with Auth.js's own `encode`, using the
 * app's AUTH_SECRET and the same cookie name auth.config.ts derives. This is
 * the standard fixture approach for automated capture: no password is typed
 * into a form, none is stored in this file, and the token expires like any
 * other. The alternative — driving the login form — would mean putting a
 * credential into a page from a script, which is a thing worth not doing even
 * when it is your own app.
 *
 * The screenshots are the point of the exercise: a guide book that describes
 * a screen instead of showing it is a guide book nobody finishes reading.
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { encode } from "next-auth/jwt";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BASE = process.env.CAPTURE_BASE_URL ?? "http://localhost:3001";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs", "screens");

/* Chrome, wherever this machine keeps it. */
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean) as string[];

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 2 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

/** One screen to photograph. */
type Shot = {
  /** File stem — becomes docs/screens/<id>.desktop.png. */
  id: string;
  path: string;
  /** Wait for this to exist before shooting, so the page is actually ready. */
  waitFor?: string;
  /** Skip the phone version — wide tables that teach nothing on a handset. */
  desktopOnly?: boolean;
  /** Extra settle time for pages that stream in data. */
  settleMs?: number;
};

/** Department → who to sign in as, and what to photograph. */
export const DEPARTMENTS: {
  key: string;
  email: string;
  shots: Shot[];
}[] = [
  {
    key: "china-warehouse",
    email: "china@aitransit.co.zm",
    shots: [
      { id: "cn-home", path: "/app" },
      /*
        /app/cargo/new, NOT /app/receive.

        `/app/receive` is the LUSAKA receiving queue and is gated on
        batch.receive, which the China desk does not hold — so this shot was a
        photograph of "That area is not yours", printed in the China Warehouse
        guide book under the heading "Receiving cargo". The China desk's
        receiving screen is the cargo form.
      */
      { id: "cn-receive", path: "/app/cargo/new" },
      { id: "cn-loading-tables", path: "/app/batches" },
      { id: "cn-search", path: "/app/search" },
      { id: "cn-customers", path: "/app/customers" },
      { id: "cn-requests", path: "/app/requests" },
    ],
  },
  {
    key: "zambia-warehouse",
    email: "warehouse@aitransit.co.zm",
    shots: [
      { id: "zm-home", path: "/app" },
      { id: "zm-arrived", path: "/app/shipments" },
      { id: "zm-incoming", path: "/app/incoming" },
      { id: "zm-release", path: "/app/release" },
      // /app/scan redirects to /app/release, so it is the same photograph.
      { id: "zm-inventory", path: "/app/inventory", desktopOnly: true },
    ],
  },
  {
    key: "finance",
    email: "finance@aitransit.co.zm",
    shots: [
      { id: "fi-home", path: "/app" },
      { id: "fi-overview", path: "/app/finance" },
      { id: "fi-credit", path: "/app/finance/credit" },
      { id: "fi-accounts", path: "/app/finance/accounts" },
      { id: "fi-collections", path: "/app/collections" },
      { id: "fi-pickup-notes", path: "/app/finance/pickup-notes" },
      { id: "fi-pricing", path: "/app/finance/pricing", desktopOnly: true },
      { id: "fi-money-desk", path: "/app/finance/exchange" },
      { id: "fi-fx-board", path: "/app/finance/fx-board" },
      { id: "fi-supplier-payments", path: "/app/finance/supplier-payments" },
      { id: "fi-ledger", path: "/app/finance/transactions", desktopOnly: true },
    ],
  },
  {
    key: "customer-support",
    email: "support@aitransit.co.zm",
    shots: [
      { id: "cs-home", path: "/app" },
      { id: "cs-search", path: "/app/search" },
      { id: "cs-tickets", path: "/app/support/tickets" },
      { id: "cs-appointments", path: "/app/appointments" },
      { id: "cs-exceptions", path: "/app/exceptions" },
      { id: "cs-customers", path: "/app/customers" },
      { id: "cs-markets", path: "/app/support/markets" },
    ],
  },
  {
    /*
      The customer portal, photographed as the demo customer.
      Signs in with a CUSTOMER account, so every page is the customer's own
      records — the same session the portal itself resolves.
    */
    key: "portal",
    email: "chanda.mwansa@example.co.zm",
    shots: [
      { id: "cx-home", path: "/portal" },
      { id: "cx-cargo", path: "/portal/cargo" },
      { id: "cx-track", path: "/portal/track" },
      { id: "cx-invoices", path: "/portal/invoices" },
      { id: "cx-pickup-notes", path: "/portal/pickup-notes" },
      { id: "cx-appointments", path: "/portal/appointments" },
      { id: "cx-china", path: "/portal/china" },
      { id: "cx-visits", path: "/portal/visits" },
      { id: "cx-supplier-payments", path: "/portal/supplier-payments" },
      { id: "cx-exchange", path: "/portal/exchange" },
      { id: "cx-claims", path: "/portal/claims" },
      { id: "cx-support", path: "/portal/support" },
      { id: "cx-notifications", path: "/portal/notifications" },
      { id: "cx-profile", path: "/portal/profile" },
    ],
  },
  {
    key: "admin",
    email: "admin@aitransit.co.zm",
    shots: [
      { id: "ad-home", path: "/app" },
      { id: "ad-dashboard", path: "/app/dashboard", settleMs: 2500 },
      { id: "ad-admin", path: "/app/admin" },
      { id: "ad-users", path: "/app/admin/users" },
      { id: "ad-pricing", path: "/app/admin/pricing", desktopOnly: true },
      { id: "ad-reports", path: "/app/admin/reports", desktopOnly: true },
      { id: "ad-reconciliation", path: "/app/admin/reconciliation", desktopOnly: true },
      { id: "ad-audit", path: "/app/admin/audit", desktopOnly: true },
      { id: "ad-settings", path: "/app/admin/settings" },
    ],
  },
];

async function sessionCookie(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, department: true },
  });
  if (!user) throw new Error(`No such staff account: ${email}`);

  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set — cannot mint a session.");

  // Auth.js salts the JWE with the cookie name, so this must match exactly what
  // auth.config.ts builds or the app will treat the cookie as garbage.
  const secure = process.env.NODE_ENV === "production";
  const name = `${secure ? "__Secure-" : ""}aitransit.session-token`;

  const token = await encode({
    salt: name,
    secret,
    maxAge: 60 * 60,
    token: {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });

  return { name, value: token };
}

async function shoot(page: Page, shot: Shot, mode: "desktop" | "phone") {
  const url = `${BASE}${shot.path}`;

  /*
    TWICE, on purpose.

    The dev server compiles a route the first time it is asked for, and the
    first response can arrive before its stylesheet is ready. The second visit
    is served from the compiled route with CSS in place. Cheap insurance, and
    invisible on a production build where both visits are identical.
  */
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });

  /*
    WAIT FOR TAILWIND TO BE APPLIED, not merely for a stylesheet to exist.

    The first run of this script produced twelve identical photographs of a
    giant logo. The cause was not the logo: it was that no CSS had been applied
    at all, so an inline SVG with no intrinsic size expanded to fill the
    viewport and every element sat at `position: static`. Asserting that
    something classed `fixed` actually computes to fixed is the cheapest true
    test that the stylesheet has landed.
  */
  await page
    .waitForFunction(
      () => {
        if (!document.styleSheets.length) return false;
        const probe = document.querySelector('[class*="fixed"]');
        return !probe || getComputedStyle(probe).position === "fixed";
      },
      { timeout: 30_000, polling: 200 }
    )
    .catch(() => {});

  /*
    WAIT FOR THE PAGE, NOT FOR THE NETWORK.

    `networkidle2` resolves while the app is still showing its loading splash —
    a full-bleed logo — and the first run of this script produced twelve
    identical photographs of that logo, one per page. Waiting for real sidebar
    navigation to exist is what actually says "the shell has rendered", and
    waiting for the fonts stops the guide showing a page mid-swap in a fallback
    face.
  */
  await page
    .waitForFunction(
      () => {
        const nav = document.querySelector("nav a, aside a");
        const text = (document.body.innerText ?? "").trim();
        return Boolean(nav) && text.length > 120;
      },
      { timeout: 30_000, polling: 250 }
    )
    .catch(() => {});

  if (shot.waitFor) {
    await page.waitForSelector(shot.waitFor, { timeout: 20_000 }).catch(() => {});
  }

  await page.evaluate(() => (document as any).fonts?.ready).catch(() => {});
  // And a beat for count-ups and scroll reveals to finish, or the guide shows
  // figures mid-animation and half-faded panels.
  await new Promise((r) => setTimeout(r, shot.settleMs ?? 2200));

  const file = path.join(OUT, `${shot.id}.${mode}.png`);
  await page.screenshot({ path: file as `${string}.png`, fullPage: false });
  return file;
}

async function main() {
  const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
  await mkdir(OUT, { recursive: true });

  // `require` does not exist in an ES module; the try/catch around it was
  // swallowing a ReferenceError and reporting "no Chrome found" on a machine
  // that had Chrome.
  const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chrome) throw new Error(`No Chrome found. Tried:\n  ${CHROME_CANDIDATES.join("\n  ")}`);

  const browser: Browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-color-profile=srgb"],
  });

  const manifest: Record<string, string[]> = {};
  let taken = 0;

  try {
    for (const dept of DEPARTMENTS) {
      if (only && dept.key !== only) continue;
      const cookie = await sessionCookie(dept.email);
      manifest[dept.key] = [];

      for (const mode of ["desktop", "phone"] as const) {
        const page = await browser.newPage();
        await page.setViewport(mode === "desktop" ? DESKTOP : PHONE);
        await page.setCookie({
          name: cookie.name,
          value: cookie.value,
          url: BASE,
          httpOnly: true,
          sameSite: "Lax",
        });

        for (const shot of dept.shots) {
          if (mode === "phone" && shot.desktopOnly) continue;
          try {
            const file = await shoot(page, shot, mode);
            manifest[dept.key].push(path.basename(file));
            taken += 1;
            process.stdout.write(`  ${dept.key}/${shot.id}.${mode}\n`);
          } catch (error) {
            console.warn(`  ! ${dept.key}/${shot.id}.${mode} — ${(error as Error).message.slice(0, 90)}`);
          }
        }
        await page.close();
      }
    }
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n${taken} screenshots written to docs/screens/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
