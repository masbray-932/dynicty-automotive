import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { themeCssVariables } from "@/features/theme/domain";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-hidden bg-background text-foreground" style={themeCssVariables()}>{children}</body>
    </html>
  );
}
