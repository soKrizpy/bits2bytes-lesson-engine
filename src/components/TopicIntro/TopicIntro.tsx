'use client';

// src/components/TopicIntro/TopicIntro.tsx
// Full-screen splash shown before the learning path begins for first-time visits
// (no persisted localStorage state). Surfaces lesson.introduction and key metadata.
// Uses the same fade-in + scale animation pattern as AchievementScreen.
// Topic-agnostic — works for any lesson content.

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Lesson } from '@/types/lesson';

interface TopicIntroProps {
  lesson: Lesson;
  onStart: () => void;
  onBack: () => void;
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};



export function TopicIntro({ lesson, onStart, onBack }: TopicIntroProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const { metadata, introduction, objectives } = lesson;
  const analogy = introduction?.analogy;
  // Show at most 4 objectives to keep the splash focused
  const displayObjectives = objectives.slice(0, 4);
  const levelLabel = LEVEL_LABELS[metadata.level] ?? metadata.level;

  return (
    <div
      className={[
        'min-h-screen bg-background flex items-center justify-center p-4 sm:p-6',
        'transition-[opacity,transform] motion-reduce:transition-[opacity_100ms]',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
      ].join(' ')}
      style={{ transitionDuration: visible ? '500ms' : '0ms' }}
      role="main"
      aria-label="Topic introduction"
    >
      <div className="max-w-xl w-full space-y-7">

        {/* ── Brand wordmark ───────────────────────────────────────────── */}
        <div className="text-center">
          <span className="text-primary font-bold text-xl tracking-tight drop-shadow-sm">
            BITS2BYTES
          </span>
        </div>

        {/* ── Category pill + stage icon ───────────────────────────────── */}
        <div className="text-center space-y-4">
          <div
            className={[
              'text-6xl sm:text-7xl transition-transform duration-500 motion-reduce:transition-none',
              visible ? 'scale-100' : 'scale-75',
            ].join(' ')}
            aria-hidden="true"
          >
            🚀
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="bg-primary/10 text-primary text-xs font-semibold uppercase tracking-[0.18em] px-3 py-1 rounded-full">
              {metadata.category}
            </span>
            <span className="bg-card text-text-muted text-xs font-semibold uppercase tracking-[0.18em] px-3 py-1 rounded-full">
              {levelLabel}
            </span>
          </div>
        </div>

        {/* ── Title + description ──────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <p className="text-primary text-sm font-semibold uppercase tracking-[0.2em]">
            Topic {metadata.topicNumber}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-base leading-tight tracking-tight">
            {metadata.title}
          </h1>
          <p className="text-text-muted leading-relaxed">{metadata.description}</p>
        </div>

        {/* ── Analogy callout (only when present) ─────────────────────── */}
        {analogy !== undefined && (
          <section
            className="bg-primary/10 border-l-4 border-primary rounded-r-2xl px-5 py-4 space-y-1"
            aria-labelledby="analogy-heading"
          >
            <h2 id="analogy-heading" className="text-xs font-semibold text-primary uppercase tracking-wide">
              How to Think About It
            </h2>
            <p className="text-text-base text-sm leading-relaxed">{analogy}</p>
          </section>
        )}

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Estimated time */}
          <div className="bg-card/70 border border-white/10 rounded-2xl p-3 sm:p-4 space-y-1 text-center">
            <p className="text-lg sm:text-2xl font-bold text-text-base tabular-nums leading-snug">
              <span aria-hidden="true" className="block">⏱</span>
              {metadata.estimatedTime}m
            </p>
            <p className="text-xs text-text-muted">Est. time</p>
          </div>

          {/* XP */}
          <div className="bg-card border border-xpGold/25 rounded-2xl p-3 sm:p-4 space-y-1 text-center">
            <p className="text-lg sm:text-2xl font-bold text-xpGold tabular-nums leading-snug">
              <span aria-hidden="true" className="block">⭐</span>
              {metadata.xp}
            </p>
            <p className="text-xs text-text-muted">XP available</p>
          </div>

          {/* Level */}
          <div className="bg-card/70 border border-white/10 rounded-2xl p-3 sm:p-4 space-y-1 text-center">
            <p className="text-sm sm:text-xl font-bold text-text-base leading-snug break-words">
              <span aria-hidden="true" className="block text-lg sm:text-2xl">📊</span>
              {levelLabel}
            </p>
            <p className="text-xs text-text-muted">Level</p>
          </div>
        </div>

        {/* ── What You'll Learn ────────────────────────────────────────── */}
        <section
          className="bg-card border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3"
          aria-labelledby="objectives-heading"
        >
          <h2
            id="objectives-heading"
            className="text-text-base font-semibold"
          >
            What You&apos;ll Learn
          </h2>
          <ul className="space-y-2 text-sm text-text-muted">
            {displayObjectives.map((objective) => (
              <li key={objective} className="flex gap-2">
                <span className="text-success mt-0.5" aria-hidden="true">
                  ✓
                </span>
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <Button
            onClick={onStart}
            size="lg"
            className="w-full"
            aria-label={`Start learning: ${metadata.title}`}
          >
            Start Learning →
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={onBack}
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
}
