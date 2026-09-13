'use client';

// src/components/ui/XpPopAnimation.tsx
// Brief centered floating "+N XP" animation shown when a node awards XP.
// Respects prefers-reduced-motion and uses a short synthesized coin sound.

import { useEffect } from 'react';

interface XpPopAnimationProps {
  xp: number;
  visible: boolean;
}

function playCoinSound() {
  if (typeof window === 'undefined' || !window.AudioContext) return;

  const context = new window.AudioContext();
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
  oscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.16);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.24);
  oscillator.addEventListener('ended', () => { void context.close(); }, { once: true });
}

export function XpPopAnimation({ xp, visible }: XpPopAnimationProps) {
  useEffect(() => {
    if (visible && xp > 0) playCoinSound();
  }, [visible, xp]);

  if (!visible || xp <= 0) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
      aria-live="polite"
      aria-label={`+${xp} XP earned`}
    >
      <span className="animate-xp-gain motion-reduce:animate-none motion-reduce:opacity-0 rounded-full border border-xpGold/30 bg-background/90 px-5 py-2 text-xl font-extrabold text-xpGold shadow-xl shadow-xpGold/20 backdrop-blur-sm select-none">
        +{xp} XP
      </span>
    </div>
  );
}
