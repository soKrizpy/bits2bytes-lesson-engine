'use client';

// src/components/ui/XpPopAnimation.tsx
// Brief floating "+N XP ⭐" animation shown when a node awards XP.
// Respects prefers-reduced-motion.

interface XpPopAnimationProps {
  xp: number;
  visible: boolean;
}

export function XpPopAnimation({ xp, visible }: XpPopAnimationProps) {
  if (!visible || xp <= 0) return null;

  return (
    <span
      className="animate-xp-gain motion-reduce:animate-none motion-reduce:opacity-0 text-xpGold font-bold text-sm pointer-events-none select-none"
      aria-live="polite"
      aria-label={`+${xp} XP earned`}
    >
      +{xp} XP ⭐
    </span>
  );
}
