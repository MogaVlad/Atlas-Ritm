import type { ReactNode } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { BottomNav } from "@/components/bank/BottomNav";
import { NotificationBanner } from "@/components/bank/NotificationBanner";
import { PhoneFrame } from "@/components/bank/PhoneFrame";
import { TopBar } from "@/components/bank/TopBar";

const display = Bricolage_Grotesque({
  variable: "--font-atlas-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
});

export default function BankLayout({ children }: { children: ReactNode }) {
  return (
    <PhoneFrame>
      <div className={`${display.variable} flex min-h-full flex-1 flex-col bg-atlas-paper text-atlas-ink`}>
        <TopBar />
        <main className="flex flex-1 flex-col px-5 pt-5 pb-8">{children}</main>
        <BottomNav />
        <NotificationBanner />
      </div>
    </PhoneFrame>
  );
}
