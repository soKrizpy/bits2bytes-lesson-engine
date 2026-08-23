'use client';

// src/components/LessonEngine.tsx
// THE reusable entry point for the BITS2BYTES Lesson Engine.
//
// Usage: <LessonEngine topicId="beginner-html-01" />
//        <LessonEngine topicId="beginner-css-01" />
//        <LessonEngine topicId="intermediate-js-01" />
//
// This component does NOT know what subject is being taught.
// It reads everything from the lesson JSON via useEngineState.

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEngineState } from '@/hooks/useEngineState';
import { LocalStorageAdapter } from '@/persistence/localStorageAdapter';
import { LearningPath } from '@/components/LearningPath/LearningPath';
import { NodeRenderer } from '@/components/NodeRenderer/NodeRenderer';
import { AchievementScreen } from '@/components/AchievementScreen/AchievementScreen';
import { XPBadge } from '@/components/ui/XPBadge';
import { ErrorScreen } from '@/components/ui/ErrorScreen';

interface LessonEngineProps {
  topicId: string;
}

// Single adapter instance per engine mount — avoids re-creating on every render
const adapter = new LocalStorageAdapter();

export function LessonEngine({ topicId }: LessonEngineProps) {
  const router = useRouter();
  const {
    lesson,
    studentState,
    loadError,
    saveError,
    advanceNode,
    submitQuizAttempt,
  } = useEngineState(topicId, adapter);

  // Stable quiz questions reference — avoids passing a new array ref on every render
  const quizQuestions = useMemo(
    () => (lesson !== null ? lesson.quiz.questions : []),
    [lesson]
  );

  // ── Load error: hard block ─────────────────────────────────────────────────
  if (loadError !== null) {
    return <ErrorScreen title="Could not load lesson" message={loadError} />;
  }

  // ── Loading: lesson JSON not yet available ─────────────────────────────────
  if (lesson === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto"
            aria-hidden="true"
          />
          <p className="text-text-muted text-sm">Loading lesson…</p>
        </div>
      </div>
    );
  }

  // ── Topic completed: Achievement screen replaces full layout ───────────────
  if (studentState.topicCompleted) {
    return (
      <AchievementScreen
        lesson={lesson}
        studentState={studentState}
        onReturn={() => { router.push('/'); }}
      />
    );
  }

  // ── Current node ───────────────────────────────────────────────────────────
  const currentNode = lesson.learningPath[studentState.currentNodeIndex];

  // ── Main lesson layout ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-primary font-bold text-lg tracking-tight">
              BITS2BYTES
            </span>
            <span className="text-text-muted text-sm hidden sm:block">
              {lesson.metadata.title}
            </span>
          </div>

          {/* Inline XP badge for mobile (fixed-position badge hidden on small screens) */}
          <div className="sm:hidden">
            <div className="flex items-center gap-1.5 bg-card border border-xpGold/40 rounded-full px-3 py-1.5">
              <span className="text-xpGold text-sm font-bold" aria-hidden="true">⭐</span>
              <span className="text-xpGold text-sm font-bold tabular-nums">
                {studentState.xpEarned} XP
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Fixed XP badge — desktop only ──────────────────────────────────── */}
      <div className="hidden sm:block">
        <XPBadge xpEarned={studentState.xpEarned} />
      </div>

      {/* ── Non-blocking save error banner ─────────────────────────────────── */}
      {saveError !== null && (
        <div
          className="bg-warning/10 border-b border-warning/20 px-4 py-2 text-xs text-warning text-center"
          role="alert"
          aria-live="polite"
        >
          ⚠️ {saveError}
        </div>
      )}

      {/* ── Main content area ───────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row">

        {/* ── Learning path sidebar ────────────────────────────────────────── */}
        <aside className="lg:w-72 lg:shrink-0 lg:border-r lg:border-white/10 lg:overflow-y-auto lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14">
          {/* Mobile: compact strip above content */}
          <div className="lg:hidden border-b border-white/10">
            <div className="px-4 py-3">
              <LearningPath
                nodes={lesson.learningPath}
                studentState={studentState}
              />
            </div>
          </div>
          {/* Desktop: full vertical sidebar */}
          <div className="hidden lg:block h-full">
            <LearningPath
              nodes={lesson.learningPath}
              studentState={studentState}
            />
          </div>
        </aside>

        {/* ── Node content area ────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            {currentNode !== undefined ? (
              <NodeRenderer
                node={currentNode}
                studentState={studentState}
                quizQuestions={quizQuestions}
                onAdvance={advanceNode}
                onSubmitQuizAttempt={submitQuizAttempt}
              />
            ) : (
              // All nodes traversed but topicCompleted flag not yet flushed — transient state
              <div className="text-center space-y-4 py-20">
                <p className="text-text-muted text-sm">Completing topic…</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
