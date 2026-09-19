'use client';

// src/components/ui/TopProgressBar.tsx
// Sticky top progress bar: Step N of M, fill bar, topic title, and XP feedback.

import { useEffect } from 'react';
import { XpPopAnimation } from './XpPopAnimation';

interface TopProgressBarProps {
  currentStep: number;      // 1-based
  totalSteps: number;
  topicTitle: string;
  xpPopValue: number | null;
  onXpPopDone: () => void;
}

export function TopProgressBar({
  currentStep,
  totalSteps,
  topicTitle,
  xpPopValue,
  onXpPopDone,
}: TopProgressBarProps) {
  const pct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  // Auto-clear XP pop after animation completes (2000ms)
  useEffect(() => {
    if (xpPopValue === null) return;
    const timer = setTimeout(() => onXpPopDone(), 2000);
    return () => clearTimeout(timer);
  }, [xpPopValue, onXpPopDone]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[var(--bg-page)]/90 backdrop-blur border-b border-white/10">
        {/* Row: step counter · title */}
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between gap-3">
          {/* Left: Step N of M */}
          <span
            aria-live="polite"
            className="text-xs font-semibold text-text-muted shrink-0 tabular-nums"
          >
            Step {currentStep} of {totalSteps}
          </span>

          {/* Center: topic title */}
          <span className="text-xs text-text-muted truncate hidden sm:block flex-1 text-center">
            {topicTitle}
          </span>

        </div>

        {/* Progress fill bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label={`Lesson progress: step ${currentStep} of ${totalSteps}`}
          />
        </div>
      </header>

      {/* Centered, non-blocking reward feedback. */}
      {xpPopValue !== null && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
          <div className="rounded-full border border-xpGold/40 bg-card/95 px-5 py-3 shadow-xl shadow-black/30 backdrop-blur">
            <XpPopAnimation xp={xpPopValue} visible />
          </div>
        </div>
      )}
    </>
  );
}
