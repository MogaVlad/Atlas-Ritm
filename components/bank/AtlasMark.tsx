/**
 * Atlas brand: an original globe mark (circle, meridians, parallels and a "you are here" pin)
 * and a lowercase wordmark. Fictional bank; not based on any real bank's logo.
 */
export function AtlasGlobe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="16" cy="16" rx="5.5" ry="13" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 16h26" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.2 9.5c6.5 2.2 15.1 2.2 21.6 0M5.2 22.5c6.5-2.2 15.1-2.2 21.6 0" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="21.5" cy="12.6" r="2.6" fill="var(--atlas-brass)" stroke="var(--atlas-paper)" strokeWidth="1.25" />
    </svg>
  );
}

export function AtlasWordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-atlas-ink ${className ?? ""}`}>
      <AtlasGlobe className="size-7" />
      <span className="font-display text-[1.6rem] leading-none font-semibold tracking-[-0.04em]">atlas</span>
    </span>
  );
}
