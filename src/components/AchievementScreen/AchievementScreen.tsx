'use client';

// src/components/AchievementScreen/AchievementScreen.tsx
// Shown when topicCompleted = true.
// Celebrates topic completion with the student's achievements.
// Respects prefers-reduced-motion (≤100ms fade instead of full animation).
// Topic-agnostic — works for any lesson content.

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Lesson } from '@/types/lesson';
import type { StudentState } from '@/types/state';

interface AchievementScreenProps {
  lesson: Lesson;
  studentState: StudentState;
  onReturn: () => void;
}

export function AchievementScreen({
  lesson,
  studentState,
  onReturn,
}: AchievementScreenProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay before entering to allow the animation to fire
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Calculate max possible quiz score
  const maxPossibleScore = lesson.quiz.questions.reduce(
    (sum, q) => sum + q.points,
    0
  );
  const quizPercentage =
    maxPossibleScore > 0
      ? Math.round((studentState.bestQuizScore / maxPossibleScore) * 100)
      : 0;

  const completedCount = studentState.completedNodes.length;
  const totalNodes = lesson.learningPath.length;
  const achievementIcon = lesson.completion.achievementIcon ?? '🏆';

  return (
    <div
      className={[
        'min-h-screen bg-background flex items-center justify-center p-6',
        'transition-opacity motion-reduce:transition-[opacity_100ms]',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      style={{
        transitionDuration: visible ? '500ms' : '0ms',
      }}
      role="main"
      aria-label="Topic completion"
    >
      <div className="max-w-lg w-full space-y-8 text-center">

        {/* Achievement icon + headline */}
        <div className="space-y-4">
          <div
            className={[
              'text-7xl transition-transform duration-500 motion-reduce:transition-none',
              visible ? 'scale-100' : 'scale-75',
            ].join(' ')}
            aria-hidden="true"
          >
            {achievementIcon}
          </div>

          <div className="space-y-2">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest">
              Topic Complete!
            </p>
            <h1 className="text-3xl font-bold text-text-base leading-tight">
              {lesson.metadata.title}
            </h1>
            <p className="text-text-muted">{lesson.completion.message}</p>
          </div>
        </div>

        {/* Achievement badge */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4 inline-block mx-auto">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
            Achievement Unlocked
          </p>
          <p className="text-text-base font-bold text-lg">
            {lesson.completion.achievementName}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* XP */}
          <div className="bg-card border border-xpGold/20 rounded-xl p-4 space-y-1">
            <p className="text-2xl font-bold text-xpGold tabular-nums">
              ⭐ {studentState.xpEarned}
            </p>
            <p className="text-xs text-text-muted">XP Earned</p>
          </div>

          {/* Quiz score */}
          <div className="bg-card border border-white/10 rounded-xl p-4 space-y-1">
            <p className="text-2xl font-bold text-text-base tabular-nums">
              {quizPercentage}%
            </p>
            <p className="text-xs text-text-muted">Quiz Score</p>
          </div>

          {/* Nodes */}
          <div className="bg-card border border-success/20 rounded-xl p-4 space-y-1">
            <p className="text-2xl font-bold text-success tabular-nums">
              {completedCount}/{totalNodes}
            </p>
            <p className="text-xs text-text-muted">Nodes Done</p>
          </div>
        </div>

        {/* Return action */}
        <Button
          onClick={onReturn}
          size="lg"
          className="w-full"
          aria-label="Return to topic overview"
        >
          Return to Overview
        </Button>
      </div>
    </div>
  );
}
