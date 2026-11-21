import type { ReactNode } from "react";
import { BottomNav } from "@/components/bank/BottomNav";
import { NotificationBanner } from "@/components/bank/NotificationBanner";
import { TopBar } from "@/components/bank/TopBar";

/** The Ritm tab: same Atlas chrome as the other tabs. Onboarding stays full screen (outside this group). */
export default function RitmTabLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="flex flex-1 flex-col px-5 pt-5 pb-8">{children}</main>
      <BottomNav />
      <NotificationBanner />
    </>
  );
}
