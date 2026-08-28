/**
 * Build the department guide books.
 *
 *   npx tsx scripts/capture-screens.mts     # photographs first
 *   npx tsx scripts/build-guides.mts        # then the books
 *
 * Ten PDFs into docs/guides/ — five departments, English and 中文.
 *
 * HTML AND CHROME, not a PDF drawing library. The invoice PDF in
 * lib/invoice-pdf.ts is drawn line by line with jsPDF, which is right for a
 * one-page document with a fixed layout and wrong for a forty-page book with
 * photographs, page breaks and two writing systems. Chrome already does
 * pagination, widow control, CJK line breaking and image scaling correctly, and
 * it is already a dependency because the screenshots need it.
 *
 * The screenshots are embedded as data URIs rather than linked, so a finished
 * PDF is one file somebody can send over WhatsApp without it losing its
 * pictures.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import puppeteer, { type Browser } from "puppeteer-core";

import { GUIDES, UI, type Guide, type Lang, type Section } from "./guide-content";

const HERE = path.dirname(fileURLToPath(import.meta.url));
/*
  The PRINT copies, not the originals.

  A raw 2880x1800 screenshot is about 1 MB, and a book with twenty of them
  embedded as data URIs is a twenty-megabyte HTML string that Chrome will not
  finish parsing — the first attempt at this timed out at two minutes on every
  document. Downscaled to the width a page actually renders them at, the whole
  set is 5.8 MB and a book builds in seconds. Run scripts/optimise-screens.mjs
  after capturing.
*/
const SCREENS = path.join(HERE, "..", "docs", "screens", "print");
const OUT = path.join(HERE, "..", "docs", "guides");

const CHROME = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
].filter(Boolean).find((p) => existsSync(p as string)) as string | undefined;

/* --------------------------------------------------------------- helpers */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A screenshot as a data URI, or null when it was never captured. */
async function embed(id: string, mode: "desktop" | "phone") {
  const file = path.join(SCREENS, `${id}.${mode}.jpg`);
  if (!existsSync(file)) return null;
  const buf = await readFile(file);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/* ------------------------------------------------------------------ style */

/*
  The book's own design, deliberately not the app's.

  A manual is read on paper, often photocopied, sometimes in a warehouse under
  a strip light. So: white ground, ink-black text, one accent, generous leading
  and a type size a supervisor can read at arm's length. The brand shows up in
  the navy band and the copper rule, and nowhere else.
*/
const CSS = (lang: Lang) => `
  @page { size: A4; margin: 18mm 16mm 20mm; }
  @page :first { margin: 0; }

  :root {
    --ink: #0b1a2d;
    --body: #1f2a37;
    --muted: #5b6675;
    --line: #dfe3e8;
    --copper: #b4610f;
    --emerald: #0c6e5b;
    --wash: #f5f7f9;
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }

  body {
    font-family: ${lang === "zh"
      ? `"PingFang SC", "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif`
      : `"Helvetica Neue", Helvetica, Arial, sans-serif`};
    color: var(--body);
    font-size: ${lang === "zh" ? "10.6pt" : "10.4pt"};
    line-height: ${lang === "zh" ? 1.85 : 1.62};
    -webkit-font-smoothing: antialiased;
  }

  /* ------------------------------------------------------------- cover */
  .cover {
    height: 297mm; width: 210mm;
    background: linear-gradient(160deg, #0b1a2d 0%, #12304a 55%, #0d3b34 100%);
    color: #fff; padding: 30mm 22mm; position: relative;
    page-break-after: always; display: flex; flex-direction: column;
  }
  .cover .mark { font-size: 21pt; font-weight: 800; letter-spacing: .16em; }
  .cover .mark small { display:block; font-size: 8.5pt; letter-spacing: .42em; opacity:.72; font-weight:600; margin-top:3mm; }
  .cover .kicker { margin-top: auto; font-size: 9pt; letter-spacing: .3em; text-transform: uppercase; color: #d99a52; font-weight: 700; }
  .cover h1 { font-size: 34pt; line-height: 1.12; margin: 5mm 0 0; font-weight: 800; letter-spacing: -0.01em; }
  .cover .sub { font-size: 12pt; opacity: .82; margin-top: 5mm; max-width: 130mm; }
  .cover .owns { margin-top: 14mm; padding-top: 7mm; border-top: 1px solid rgba(255,255,255,.22); }
  .cover .owns h2 { font-size: 8.5pt; letter-spacing: .22em; text-transform: uppercase; opacity:.62; margin:0 0 4mm; font-weight:700; }
  .cover .owns li { margin: 0 0 3mm; opacity: .93; font-size: 10.5pt; }
  .cover .foot { margin-top: 12mm; font-size: 9pt; opacity: .6; }

  /* ------------------------------------------------------------ contents */
  .toc { page-break-after: always; }
  .front { page-break-after: always; }
  h2.h { font-size: 17pt; color: var(--ink); margin: 0 0 6mm; font-weight: 800; letter-spacing: -0.01em; }
  .toc ol { list-style: none; margin: 0; padding: 0; counter-reset: toc; }
  .toc li {
    counter-increment: toc; display: flex; gap: 5mm; align-items: baseline;
    padding: 3.4mm 0; border-bottom: 1px solid var(--line);
  }
  .toc li::before {
    content: counter(toc, decimal-leading-zero);
    font-variant-numeric: tabular-nums; color: var(--copper);
    font-weight: 800; font-size: 10pt; min-width: 9mm;
  }
  .toc .t { font-weight: 700; color: var(--ink); }
  .toc .d { color: var(--muted); font-size: 9.4pt; }

  /* ------------------------------------------------------------ section */
  .sec { page-break-before: always; }
  .sec-head { border-top: 2.5pt solid var(--copper); padding-top: 4mm; margin-bottom: 5mm; }
  .sec-no { font-size: 8.5pt; font-weight: 800; letter-spacing: .2em; color: var(--copper); text-transform: uppercase; }
  .sec h3 { font-size: 19pt; color: var(--ink); margin: 2mm 0 3mm; font-weight: 800; letter-spacing:-0.01em; }
  .lede { font-size: 11pt; color: var(--body); margin: 0 0 6mm; max-width: 155mm; }

  /* ------------------------------------------------------------- shots */
  .shots { display: flex; gap: 5mm; align-items: flex-start; margin: 0 0 6mm; page-break-inside: avoid; }
  .shot { border: 1px solid var(--line); border-radius: 2.5mm; overflow: hidden; background: var(--wash); }
  .shot.desk { flex: 1 1 auto; }
  .shot.ph { flex: 0 0 42mm; }
  .shot img { display: block; width: 100%; }
  .cap { font-size: 7.6pt; color: var(--muted); padding: 1.8mm 2.5mm; background: #fff; border-top: 1px solid var(--line); letter-spacing: .04em; }

  /* ------------------------------------------------------------- steps */
  ol.steps { list-style: none; margin: 0 0 5mm; padding: 0; counter-reset: st; }
  ol.steps > li {
    counter-increment: st; position: relative; padding: 0 0 4mm 11mm;
    page-break-inside: avoid;
  }
  ol.steps > li::before {
    content: counter(st); position: absolute; left: 0; top: -0.4mm;
    width: 7mm; height: 7mm; border-radius: 50%;
    background: var(--ink); color: #fff; font-size: 8.4pt; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }
  ol.steps .act { font-weight: 700; color: var(--ink); }
  ol.steps .why { display: block; color: var(--muted); font-size: 9.6pt; margin-top: 1mm; }

  /* ------------------------------------------------------------ callouts */
  .box { padding: 4mm 5mm; border-radius: 2.5mm; margin: 0 0 5mm; page-break-inside: avoid; font-size: 10pt; }
  .box .lbl { font-size: 8pt; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; display: block; margin-bottom: 1.6mm; }
  .warn { background: #fdf3ec; border-left: 3.5pt solid var(--copper); }
  .warn .lbl { color: var(--copper); }
  .note { background: #eef5f3; border-left: 3.5pt solid var(--emerald); }
  .note .lbl { color: var(--emerald); }

  /* --------------------------------------------------------------- misc */
  .signin { background: var(--wash); border: 1px solid var(--line); border-radius: 3mm; padding: 6mm; margin-bottom: 6mm; }
  .signin .row { display: flex; gap: 4mm; margin-top: 3mm; font-size: 9.6pt; }
  .signin .k { color: var(--muted); min-width: 26mm; }
  .signin .v { font-weight: 700; color: var(--ink); font-family: ui-monospace, Menlo, monospace; }
`;

/* ------------------------------------------------------------------ pages */

function coverHtml(g: Guide, lang: Lang) {
  return `
  <div class="cover">
    <div class="mark">AITRANSIT<small>CARGO</small></div>
    <div class="kicker">${esc(UI.guideBook[lang])}</div>
    <h1>${esc(g.name[lang])}</h1>
    <div class="sub">${esc(g.subtitle[lang])}</div>
    <div class="owns">
      <h2>${esc(UI.youAreResponsibleFor[lang])}</h2>
      <ul style="margin:0;padding-left:5mm">
        ${g.owns.map((o) => `<li>${esc(o[lang])}</li>`).join("")}
      </ul>
    </div>
    <div class="foot">${esc(g.account)} · ${esc(UI.department[lang])}</div>
  </div>`;
}

function tocHtml(g: Guide, lang: Lang) {
  return `
  <div class="toc">
    <h2 class="h">${esc(UI.contents[lang])}</h2>
    <ol>
      ${g.sections
        .map((s) => `<li><span><span class="t">${esc(s.title[lang])}</span><br><span class="d">${esc(s.lede[lang])}</span></span></li>`)
        .join("")}
    </ol>

  </div>`;
}

/*
  Front matter, on its own page.

  This used to sit under the contents list, which worked for a six-section book
  and broke for a ten-section one: the list filled the page, the sign-in panel
  and the two callouts spilled, and every book carried a page three that held a
  single orphaned box and nothing else. Making it a page in its own right is
  both the fix and the better structure — it is the page a new member of staff
  actually reads first.
*/
function beforeYouStartHtml(g: Guide, lang: Lang) {
  return `
  <div class="front">
    <h2 class="h">${esc(UI.beforeYouStart[lang])}</h2>

    <div class="signin">
      <h2 class="h" style="font-size:12.5pt;margin-bottom:2mm">${esc(UI.signIn[lang])}</h2>
      <div>${esc(UI.signInLede[lang])}</div>
      <div class="row"><span class="k">${esc(UI.yourLogin[lang])}</span><span class="v">${esc(g.account)}</span></div>
    </div>

    <div class="box note">
      <span class="lbl">${esc(UI.onEveryScreen[lang])}</span>
      ${esc(UI.onEveryScreenBody[lang])}
    </div>
    <div class="box note">
      <span class="lbl">${esc(UI.goodToKnow[lang])}</span>
      ${esc(UI.langNote[lang])}
    </div>
    <div class="box warn">
      <span class="lbl">${esc(UI.helpTitle[lang])}</span>
      ${esc(UI.helpBody[lang])}
    </div>
  </div>`;
}

async function sectionHtml(s: Section, i: number, lang: Lang) {
  const desk = s.shot ? await embed(s.shot, "desktop") : null;
  const ph = s.shot && s.phone ? await embed(s.shot, "phone") : null;

  const shots =
    desk || ph
      ? `<div class="shots">
          ${desk ? `<div class="shot desk"><img src="${desk}"><div class="cap">${esc(UI.onDesktop[lang])}</div></div>` : ""}
          ${ph ? `<div class="shot ph"><img src="${ph}"><div class="cap">${esc(UI.onPhone[lang])}</div></div>` : ""}
         </div>`
      : "";

  const steps = s.steps?.length
    ? `<ol class="steps">${s.steps
        .map(
          (st) =>
            `<li><span class="act">${esc(st.do[lang])}</span>${
              st.why ? `<span class="why">${esc(st.why[lang])}</span>` : ""
            }</li>`
        )
        .join("")}</ol>`
    : "";

  const warn = s.warn
    ? `<div class="box warn"><span class="lbl">${esc(UI.careful[lang])}</span>${esc(s.warn[lang])}</div>`
    : "";
  const note = s.note
    ? `<div class="box note"><span class="lbl">${esc(UI.goodToKnow[lang])}</span>${esc(s.note[lang])}</div>`
    : "";

  return `
  <section class="sec">
    <div class="sec-head">
      <div class="sec-no">${String(i + 1).padStart(2, "0")}</div>
      <h3>${esc(s.title[lang])}</h3>
    </div>
    <p class="lede">${esc(s.lede[lang])}</p>
    ${shots}
    ${steps}
    ${warn}
    ${note}
  </section>`;
}

async function documentHtml(g: Guide, lang: Lang) {
  const sections = [];
  for (const [i, s] of g.sections.entries()) sections.push(await sectionHtml(s, i, lang));
  return `<!doctype html><html lang="${lang === "zh" ? "zh-CN" : "en"}"><head>
    <meta charset="utf-8"><style>${CSS(lang)}</style></head><body>
    ${coverHtml(g, lang)}${tocHtml(g, lang)}${beforeYouStartHtml(g, lang)}${sections.join("")}
  </body></html>`;
}

/* ------------------------------------------------------------------- main */

async function main() {
  if (!CHROME) throw new Error("No Chrome found — set CHROME_PATH.");
  await mkdir(OUT, { recursive: true });

  const browser: Browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });

  const built: string[] = [];
  try {
    for (const g of GUIDES) {
      for (const lang of ["en", "zh"] as Lang[]) {
        const html = await documentHtml(g, lang);
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "load", timeout: 180_000 });
        await page.evaluate(() => (document as any).fonts?.ready).catch(() => {});

        const file = path.join(OUT, `AITRANSIT-${g.key}-${lang}.pdf`);
        await page.pdf({
          path: file,
          format: "A4",
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: "<div></div>",
          footerTemplate: `
            <div style="width:100%;font-size:7.5pt;color:#8a939f;padding:0 16mm;
                        font-family:Helvetica,Arial,sans-serif;display:flex;
                        justify-content:space-between;">
              <span>AITRANSIT · ${esc(g.name[lang])}</span>
              <span class="pageNumber"></span>
            </div>`,
          margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" },
        });
        await page.close();
        built.push(path.basename(file));
        console.log(`  ${path.basename(file)}`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\n${built.length} guide books written to docs/guides/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
