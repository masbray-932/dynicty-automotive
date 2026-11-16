import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans, Syne } from "next/font/google";
import { systemThemeCssVariables } from "@/features/theme/domain";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-public-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Dynicty Automotive",
    template: "%s | Dynicty Automotive",
  },
  description: "Katalog mobil baru dan bekas yang tersedia dari dealer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-hidden" style={systemThemeCssVariables()}>{children}</body>
    </html>
  );
}
