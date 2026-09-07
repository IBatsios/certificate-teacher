import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { themeScript } from "@/lib/theme";
import { SiteHeader } from "./site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teacher",
  description:
    "Learn certificate chains, https, Java keystores, and reverse proxies by applying them.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The proxy mints a nonce per request and the policy allows no inline
  // script without it (D45).
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // The script below sets data-theme before React hydrates, which is a
    // difference React would otherwise complain about.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          nonce={nonce}
          // Runs before anything paints, so a reader who chose dark never
          // sees a white page first.
          dangerouslySetInnerHTML={{ __html: themeScript() }}
        />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
