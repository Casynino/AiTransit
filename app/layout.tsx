import type { Metadata, Viewport } from "next";
import {
  Inter,
  Sora,
  JetBrains_Mono,
  Fraunces,
  Plus_Jakarta_Sans,
  IBM_Plex_Mono,
} from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { COMPANY } from "@/lib/constants";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/*
  THE PUBLIC BRAND'S OWN TYPE.

  Loaded here because fonts have to be, but used only under `.ai-site` — the
  staff app keeps Sora and Inter above. Two typefaces for two audiences: the
  operational system is a tool and reads like one, and the public site is the
  first thing a customer judges the company by.

  Fraunces is an editorial serif with optical sizing, so a headline at 76px and
  a subhead at 20px are drawn differently rather than scaled. It is the single
  decision that stops this reading like every other freight template, all of
  which set a geometric sans and stop there. Plus Jakarta Sans carries the body:
  warm, slightly humanist, and legible small on a phone in daylight.
*/
const brandDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-brand-display",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const brandSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-brand-sans",
  display: "swap",
});

const brandMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-brand-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // Shares one source with the sitemap and robots file. Defaulting to
  // localhost here is how a production build ends up publishing canonical
  // URLs and share images that point at a laptop.
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${COMPANY.name} — Air cargo from China to Zambia`,
    template: `%s · ${COMPANY.shortName}`,
  },
  description:
    "Air cargo from China to Lusaka with duty included, supplier payments in RMB, and money exchange — run by one Zambian team on both ends of the route.",
  openGraph: {
    title: COMPANY.name,
    description:
      "Air cargo from China to Lusaka with duty included, plus supplier payments and money exchange.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1b33" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} ${mono.variable} ${brandDisplay.variable} ${brandSans.variable} ${brandMono.variable} font-sans`}
      >
        {/* Dark by default, and the toggle is how somebody leaves it.

            enableSystem is off deliberately. With it on, "default" means the
            visitor's operating system decides — so a customer on a light phone
            would open the site in light whatever we set here, and the choice
            would not be ours to make. The warehouse floor, the counter and the
            phone in a van all read this in the dark. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
