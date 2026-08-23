'use client';

// src/components/ui/XPBadge.tsx
// Fixed-position XP display. Shows "+N XP" gain animation when xpEarned increases.
// Always visible without scrolling. Respects prefers-reduced-motion.

import { useEffect, useRef, useState } from 'react';

interface XPBadgeProps {
  xpEarned: number;
}

export function XPBadge({ xpEarned }: XPBadgeProps) {
  const prevRef = useRef(xpEarned);
  const [gainLabel, setGainLabel] = useState<string | null>(null);

  useEffect(() => {
    const diff = xpEarned - prevRef.current;
    if (diff > 0) {
      setGainLabel(`+${diff.toString()} XP`);
      const timer = setTimeout(() => setGainLabel(null), 2000);
      prevRef.current = xpEarned;
      return () => clearTimeout(timer);
    }
    prevRef.current = xpEarned;
  }, [xpEarned]);

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col items-end gap-1 select-none"
      aria-live="polite"
      aria-label={`XP earned: ${xpEarned.toString()}`}
    >
      {/* Main badge */}
      <div className="flex items-center gap-1.5 bg-card border border-xpGold/40 rounded-full px-3 py-1.5 shadow-lg">
        <span className="text-xpGold text-sm font-bold">⭐</span>
        <span className="text-xpGold text-sm font-bold tabular-nums">
          {xpEarned} XP
        </span>
      </div>

      {/* Gain animation */}
      {gainLabel !== null && (
        <span
          className="text-xpGold text-sm font-bold animate-xp-gain motion-reduce:animate-none motion-reduce:opacity-0"
          aria-hidden="true"
        >
          {gainLabel}
        </span>
      )}
    </div>
  );
}
