import type { ReactNode } from "react";

/**
 * Wider than 500px: a 390×844 phone centred on a neutral background.
 * On a real phone: fills the screen.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-background min-[500px]:items-center min-[500px]:bg-neutral-200 min-[500px]:py-8 dark:min-[500px]:bg-neutral-900">
      <div className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-background min-[500px]:h-[844px] min-[500px]:min-h-0 min-[500px]:w-[390px] min-[500px]:rounded-[48px] min-[500px]:shadow-2xl min-[500px]:ring-8 min-[500px]:ring-neutral-900">
        <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
