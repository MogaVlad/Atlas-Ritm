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

export const metadata: Metadata = {
  title: "Atlas",
  description: "Atlas · Ritm — hackathon prototype (fictional bank)",
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
