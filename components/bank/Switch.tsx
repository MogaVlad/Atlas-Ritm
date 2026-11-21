"use client";

import { cn } from "@/lib/utils";

/** On/off switch (role="switch"). The visible label lives next to it and is linked with `labelledBy`. */
export function Switch({
  checked,
  onChange,
  labelledBy,
  describedBy,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelledBy: string;
  describedBy?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group flex min-h-11 min-w-14 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ritm disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-7 w-12 items-center rounded-full p-0.5 transition-colors motion-reduce:transition-none",
          checked ? "bg-ritm" : "bg-atlas-line",
        )}
      >
        <span
          className={cn(
            "size-6 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}
