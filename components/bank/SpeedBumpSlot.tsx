"use client";

import { SpeedBumpSheet, type SpeedBumpSheetProps } from "@/components/ritm/SpeedBumpSheet";

export type SpeedBumpSlotProps = SpeedBumpSheetProps;

/** Slot for Horia's <SpeedBumpSheet/> (H4), shown by the payment approval step when the engine pauses a payment. */
export function SpeedBumpSlot(props: SpeedBumpSlotProps) {
  return <SpeedBumpSheet {...props} />;
}
