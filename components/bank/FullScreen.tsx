import type { ReactNode } from "react";

/**
 * Covers the whole phone screen, including the Atlas top bar and bottom nav.
 * Used for the shop checkout and the payment approval step, which are not tabs of the app.
 */
export function FullScreen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`absolute inset-0 z-30 flex flex-col overflow-y-auto overscroll-y-contain [scrollbar-width:none] ${className}`}>{children}</div>;
}
