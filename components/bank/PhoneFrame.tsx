import type { ReactNode } from "react";

/**
 * Wider than 500px: a 390×844 phone centred on a neutral background.
 * On a real phone: fills the screen.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh w-full justify-center bg-background min-[500px]:h-auto min-[500px]:min-h-dvh min-[500px]:items-center min-[500px]:bg-neutral-200 min-[500px]:py-8 dark:min-[500px]:bg-neutral-900">
      {/* The inner div is the scroll container on every screen size, so sticky top/bottom bars stay put. */}
      {/* data-phone-screen: sheets opened from inside a card are portalled here, so they cover the whole phone. */}
      <div data-phone-screen className="relative flex h-full w-full flex-col overflow-hidden bg-background min-[500px]:h-[844px] min-[500px]:w-[390px] min-[500px]:rounded-[48px] min-[500px]:shadow-2xl min-[500px]:ring-8 min-[500px]:ring-neutral-900">
        {/* Block, not flex: a flex scroller would shrink the page to the screen height and its background would stop mid-scroll. */}
        <div className="min-h-0 flex-1 scroll-pt-20 scroll-pb-24 overflow-y-auto overscroll-y-contain [scrollbar-width:none]">{children}</div>
      </div>
    </div>
  );
}
