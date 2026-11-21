import type { ReactNode } from "react";
import { Space_Grotesk } from "next/font/google";
import { PhoneFrame } from "@/components/bank/PhoneFrame";

// Same display font as the Atlas shell, so font-display works on Ritm pages too.
const display = Space_Grotesk({
  variable: "--font-atlas-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export default function RitmLayout({ children }: { children: ReactNode }) {
  return (
    <PhoneFrame>
      <div className={`${display.variable} flex min-h-full flex-1 flex-col bg-atlas-paper text-atlas-ink`}>{children}</div>
    </PhoneFrame>
  );
}
