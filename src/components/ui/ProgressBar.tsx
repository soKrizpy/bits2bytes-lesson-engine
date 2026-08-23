'use client';

// src/components/ui/ProgressBar.tsx
// Animated progress bar. Respects prefers-reduced-motion.

interface ProgressBarProps {
  value: number;      // 0–100
  completed: number;
  total: number;
  className?: string;
}

export function ProgressBar({ value, completed, total, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={['space-y-1', className].filter(Boolean).join(' ')}>
      {/* Labels */}
      <div className="flex items-center justify-between text-xs font-medium text-text-muted">
        <span>{completed} / {total} steps</span>
        <span className="text-primary font-semibold">{clamped}%</span>
      </div>

      {/* Track */}
      <div
        className="h-2 rounded-full bg-white/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
