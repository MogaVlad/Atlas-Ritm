"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "@/lib/i18n";
import { LEVELS } from "./content";
import { formatAltitude } from "./format";

/** Camps along the trail, base to summit (viewBox units). The summit matches the brass dot of the logo. */
const CAMPS: Record<number, { x: number; y: number }> = {
  1: { x: 112, y: 212 },
  2: { x: 214, y: 172 },
  3: { x: 136, y: 130 },
  4: { x: 182, y: 90 },
  5: { x: 160, y: 24 },
};
const TRAIL = "M112 212 C 160 204, 214 196, 214 172 C 214 150, 160 148, 136 130 C 114 112, 160 100, 182 90 C 198 80, 170 44, 160 24";

/** Which side of each camp its altitude sits on, so the label stays on the mountain. */
const LABEL_SIDE: Record<number, "left" | "right"> = { 1: "left", 2: "right", 3: "right", 4: "left" };

/**
 * The financial-education scale drawn as the Atlas mountain: five camps from 500 m to the
 * 2,500 m summit. Camps behind you are filled, yours carries the brass pin. Decorative: the page
 * states the level in words next to it.
 */
export function Mountain({ level, summit = false, className = "" }: { level: number | null; summit?: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const locale = useLocale((s) => s.locale);

  return (
    <svg viewBox="0 0 320 240" className={className} aria-hidden="true">
      {/* the far ridge, then the mountain */}
      <path d="M150 238 L250 64 L320 170 L320 238 Z" fill="var(--atlas-sea)" />
      <path d="M8 238 L70 150 L95 165 L160 18 L215 110 L240 98 L312 238 Z" fill="var(--atlas-ink)" />
      {/* the trail: dashed ahead, solid up to the current camp */}
      <path d={TRAIL} fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
      {LEVELS.map(({ level: l }) => {
        const c = CAMPS[l];
        const passed = level !== null && (l < level || (summit && l === 5));
        const here = level === l && !summit;
        const left = LABEL_SIDE[l] === "left";
        return (
          <g key={l}>
            {l === 5 ? (
              <circle cx={c.x} cy={c.y} r="6" fill="var(--atlas-brass)" />
            ) : (
              <circle cx={c.x} cy={c.y} r="5" fill={passed ? "white" : "var(--atlas-ink)"} stroke="white" strokeOpacity={passed ? 1 : 0.6} strokeWidth="2" />
            )}
            <text
              x={l === 5 ? c.x + 12 : left ? c.x - 10 : c.x + 10}
              y={c.y + 3.5}
              textAnchor={l === 5 || !left ? "start" : "end"}
              fontSize="10"
              fontWeight={here ? 700 : 500}
              fill={l === 5 ? "var(--atlas-ink)" : "white"}
              fillOpacity={here || l === 5 ? 1 : 0.7}
            >
              {formatAltitude(l, locale)}
            </text>
          </g>
        );
      })}
      {level !== null && (
        <motion.g
          initial={reduce ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {/* "you are here": the brass pin on your camp */}
          <circle cx={CAMPS[summit ? 5 : level].x} cy={CAMPS[summit ? 5 : level].y} r="11" fill="var(--atlas-brass)" fillOpacity="0.25" />
          <circle cx={CAMPS[summit ? 5 : level].x} cy={CAMPS[summit ? 5 : level].y} r="6.5" fill="var(--atlas-brass)" stroke="white" strokeWidth="2" />
        </motion.g>
      )}
    </svg>
  );
}
