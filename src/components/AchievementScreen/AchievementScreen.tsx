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
  onReview: () => void;
  onReturn: () => void;
  nextTopic?: { topicId: string; title: string };
  onNextTopic?: () => void;
}

export function AchievementScreen({
  lesson,
  studentState,
  onReview,
  onReturn,
  nextTopic,
  onNextTopic,
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
  const learned = lesson.review?.learned ?? lesson.objectives;
  const hasNextTopic = nextTopic !== undefined && onNextTopic !== undefined;

  return (
    <div
      className={[
        'min-h-screen bg-background flex items-center justify-center p-4 sm:p-6',
        'transition-opacity motion-reduce:transition-[opacity_100ms]',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      style={{
        transitionDuration: visible ? '500ms' : '0ms',
      }}
      role="main"
      aria-label="Topic completion"
    >
      <div className="max-w-xl w-full space-y-7 text-center">

        {/* Achievement icon + headline */}
        <div className="space-y-5">
          <div
            className={[
              'text-6xl sm:text-7xl transition-transform duration-500 motion-reduce:transition-none',
              visible ? 'scale-100' : 'scale-75',
            ].join(' ')}
            aria-hidden="true"
          >
            {achievementIcon}
          </div>

          <div className="space-y-3">
            <p className="text-primary text-sm font-semibold uppercase tracking-[0.2em]">
              Great job!
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-base leading-tight tracking-tight">
              Stage complete
            </h1>
            <p className="text-lg font-semibold text-text-base">{lesson.metadata.title}</p>
            <p className="max-w-md mx-auto text-text-muted leading-relaxed">
              You successfully completed this stage. {lesson.completion.message}
            </p>
          </div>
        </div>

        {/* Achievement badge */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4 inline-block mx-auto shadow-sm shadow-primary/10">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
            Achievement unlocked
          </p>
          <p className="text-text-base font-bold text-lg">
            {lesson.completion.achievementName}
          </p>
        </div>

        {/* Existing reward/progress details, visually secondary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* XP */}
          <div className="bg-card border border-xpGold/25 rounded-2xl p-3 sm:p-4 space-y-1">
            <p className="text-xl sm:text-2xl font-bold text-xpGold tabular-nums">
              ⭐ {studentState.xpEarned}
            </p>
            <p className="text-xs text-text-muted">XP earned</p>
          </div>

          {/* Quiz score */}
          <div className="bg-card/70 border border-white/10 rounded-2xl p-3 sm:p-4 space-y-1">
            <p className="text-xl sm:text-2xl font-bold text-text-base/80 tabular-nums">
              {quizPercentage}%
            </p>
            <p className="text-xs text-text-muted">Quiz score</p>
          </div>

          {/* Nodes */}
          <div className="bg-card/70 border border-success/20 rounded-2xl p-3 sm:p-4 space-y-1">
            <p className="text-xl sm:text-2xl font-bold text-success/90 tabular-nums">
              {completedCount}/{totalNodes}
            </p>
            <p className="text-xs text-text-muted">Checkpoints completed</p>
          </div>
        </div>

        <section className="bg-card border border-white/10 rounded-2xl p-5 sm:p-6 text-left space-y-3" aria-labelledby="learned-heading">
          <h2 id="learned-heading" className="text-text-base font-semibold">What you learned</h2>
          <ul className="space-y-2 text-sm text-text-muted">
            {learned.slice(0, 4).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-success" aria-hidden="true">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Actions: next adventure first, review second */}
        <div className="space-y-3">
          {hasNextTopic ? (
            <Button
              onClick={onNextTopic}
              size="lg"
              className="w-full"
              aria-label={`Continue to next adventure: ${nextTopic.title}`}
            >
              Continue to Next Adventure →
            </Button>
          ) : (
            <Button
              onClick={onReturn}
              size="lg"
              className="w-full"
              aria-label="Return to adventure"
            >
              Return to Adventure
            </Button>
          )}
          <Button
            onClick={onReview}
            variant="secondary"
            size="lg"
            className="w-full"
            aria-label="Review completed topic"
          >
            Review Topic
          </Button>
          {hasNextTopic && (
            <Button
              onClick={onReturn}
              variant="ghost"
              size="md"
              className="w-full"
              aria-label="Return to adventure"
            >
              Return to Adventure
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
