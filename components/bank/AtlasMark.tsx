/**
 * Atlas brand: an original mountain-peak mark (an "A" with a road across it and a brass dot at the
 * top), white on a black tile, and a lowercase wordmark. Fictional bank; not based on any real bank's logo.
 */
export function AtlasPeak({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <path d="M4 27 L16 5 L28 27" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M9.5 19.5 Q16 16.5 22.5 19.5" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16" cy="5" r="3.2" fill="var(--atlas-brass)" />
    </svg>
  );
}

/** The mark white on its black tile, as on an app icon. Size it with `size-*`. */
export function AtlasTile({ className }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-[28%] bg-black text-white ${className ?? ""}`} aria-hidden="true">
      <AtlasPeak className="size-[72%]" />
    </span>
  );
}

/** `light` is for the ink header on Home. */
export function AtlasWordmark({ className, tone = "ink" }: { className?: string; tone?: "ink" | "light" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${tone === "light" ? "text-white" : "text-atlas-ink"} ${className ?? ""}`}>
      <AtlasTile className="size-8" />
      <span translate="no" className="font-display text-[1.6rem] leading-none font-semibold tracking-[-0.04em]">atlas</span>
    </span>
  );
}
