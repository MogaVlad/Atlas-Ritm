import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { BankHydrator } from "@/lib/store/BankHydrator";
import { DemoControls } from "@/lib/store/DemoControls";
import { LockOpenPrompt } from "@/lib/store/LockOpenPrompt";
import { MonthStartPrompt } from "@/lib/store/MonthStartPrompt";
import { SummaryPrompt } from "@/lib/store/SummaryPrompt";
import "./globals.css";

// Inter for text: very readable at small sizes, with tabular numbers for money.
const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const title = "Ritm by Atlas · First-salary spending coach";
const description =
  "Hackathon prototype from Bank/Rupt by Stripe x FoundersHive. Try it on your phone: it runs on made-up data, with no real bank connected.";

export const metadata: Metadata = {
  // Absolute base for the link-preview image, so LinkedIn and others always get the public URL.
  metadataBase: new URL("https://atlas-ritm.vercel.app"),
  title,
  description,
  openGraph: { title, description, url: "/", siteName: "Ritm by Atlas", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <BankHydrator />
        <DemoControls />
        <SummaryPrompt />
        <MonthStartPrompt />
        <LockOpenPrompt />
      </body>
    </html>
  );
}
