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

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEngineState } from '@/hooks/useEngineState';
import { LocalStorageAdapter } from '@/persistence/localStorageAdapter';
import { LearningPath } from '@/components/LearningPath/LearningPath';
import { NodeRenderer } from '@/components/NodeRenderer/NodeRenderer';
import { NodeStageHeader } from '@/components/NodeRenderer/NodeStageHeader';
import { AchievementScreen } from '@/components/AchievementScreen/AchievementScreen';
import { TopicIntro } from '@/components/TopicIntro/TopicIntro';
import { TopicReview } from '@/components/TopicReview/TopicReview';
import { XPBadge } from '@/components/ui/XPBadge';
import { ErrorScreen } from '@/components/ui/ErrorScreen';
import { TOPIC_REGISTRY } from '@/engine/topicRegistry';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useLmsPostMessage } from '@/hooks/useLmsPostMessage';

interface LessonEngineProps {
  topicId: string;
}

// Single adapter instance per engine mount — avoids re-creating on every render
const adapter = new LocalStorageAdapter();

export function LessonEngine({ topicId }: LessonEngineProps) {
  const router = useRouter();
  const urlParams = useUrlParams();
  const { sendLessonComplete, sendQuizSubmitted, sendXpUpdate } = useLmsPostMessage(
    topicId,
    urlParams.studentId,
    urlParams.lmsOrigin,
  );
  const [viewMode, setViewMode] = useState<'achievement' | 'review'>('achievement');
  const [selectedReviewNodeIndex, setSelectedReviewNodeIndex] = useState(0);
  const [selectedLearningNodeIndex, setSelectedLearningNodeIndex] = useState<number | null>(null);
  const {
    lesson,
    studentState,
    loadError,
    saveError,
    advanceNode,
    submitQuizAttempt,
  } = useEngineState(topicId, adapter);

  // Tracks whether the intro has been dismissed this session
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  // Show intro only when no persisted state exists for this topic
  const hasSavedProgress = useMemo(
    () => adapter.loadState(topicId) !== null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topicId] // adapter is stable (module-level const); topicId change reruns
  );

  // Stable quiz questions reference — avoids passing a new array ref on every render
  const quizQuestions = useMemo(
    () => (lesson !== null ? lesson.quiz.questions : []),
    [lesson]
  );

  const currentTopicPosition = TOPIC_REGISTRY.findIndex((entry) => entry.topicId === topicId);
  const nextTopicEntry = currentTopicPosition >= 0
    ? TOPIC_REGISTRY[currentTopicPosition + 1]
    : undefined;

  useEffect(() => {
    if (studentState.topicCompleted) return;
    setSelectedLearningNodeIndex(studentState.currentNodeIndex);
  }, [studentState.currentNodeIndex, studentState.topicCompleted]);

  // ── postMessage: topic completed ─────────────────────────────────────────
  useEffect(() => {
    if (!studentState.topicCompleted) return;
    sendLessonComplete(studentState.xpEarned, studentState.bestQuizScore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentState.topicCompleted]);

  // ── postMessage: quiz attempt submitted ──────────────────────────────────
  useEffect(() => {
    const last = studentState.quizAttempts[studentState.quizAttempts.length - 1];
    if (last === undefined) return;
    sendQuizSubmitted(last.score, last.attemptNumber, studentState.bestQuizScore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentState.quizAttempts.length]);

  // ── postMessage: XP earned ───────────────────────────────────────────────
  useEffect(() => {
    if (studentState.xpEarned === 0) return;
    sendXpUpdate(studentState.xpEarned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentState.xpEarned]);

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

  // ── Topic intro: shown only on first visit (no persisted state) ───────────
  if (lesson !== null && !hasSeenIntro && !hasSavedProgress && !studentState.topicCompleted) {
    return (
      <TopicIntro
        lesson={lesson}
        onStart={() => setHasSeenIntro(true)}
        onBack={() => router.push('/')}
      />
    );
  }

  // ── Topic completed: Achievement screen replaces full layout ───────────────
  if (studentState.topicCompleted) {
    if (viewMode === 'review') {
      return (
        <TopicReview
          lesson={lesson}
          studentState={studentState}
          selectedNodeIndex={selectedReviewNodeIndex}
          onSelectNode={setSelectedReviewNodeIndex}
          onBackToAchievement={() => { setViewMode('achievement'); }}
          onReturn={() => { router.push('/'); }}
        />
      );
    }

    return (
      <AchievementScreen
        lesson={lesson}
        studentState={studentState}
        onReview={() => { setViewMode('review'); }}
        onReturn={() => { router.push('/'); }}
        {...(nextTopicEntry !== undefined
          ? {
              nextTopic: { topicId: nextTopicEntry.topicId, title: nextTopicEntry.topicId },
              onNextTopic: () => { router.push(`/lesson/${nextTopicEntry.topicId}`); },
            }
          : {})}
      />
    );
  }

  // ── Current node ───────────────────────────────────────────────────────────
  const selectedLearningNode = selectedLearningNodeIndex !== null
    ? lesson.learningPath[selectedLearningNodeIndex]
    : undefined;
  const currentNode = selectedLearningNode ?? lesson.learningPath[studentState.currentNodeIndex];
  const currentNodeIndex = selectedLearningNodeIndex ?? studentState.currentNodeIndex;
  const isCompletedSelection = currentNode !== undefined &&
    currentNodeIndex !== studentState.currentNodeIndex &&
    studentState.completedNodes.includes(currentNode.id);

  // ── Main lesson layout ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <span className="text-primary font-bold text-lg tracking-tight drop-shadow-sm">
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

      {currentNodeIndex === 0 && !isCompletedSelection && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6" aria-labelledby="topic-brief-heading">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Topic Brief</p>
            <h1 id="topic-brief-heading" className="mt-2 text-xl font-bold text-text-base">{lesson.metadata.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{lesson.metadata.description}</p>
          </div>
        </section>
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
                selectedNodeIndex={selectedLearningNodeIndex ?? studentState.currentNodeIndex}
                onSelectNode={setSelectedLearningNodeIndex}
              />
            </div>
          </div>
          {/* Desktop: full vertical sidebar */}
          <div className="hidden lg:block h-full">
            <LearningPath
              nodes={lesson.learningPath}
              studentState={studentState}
              selectedNodeIndex={selectedLearningNodeIndex ?? studentState.currentNodeIndex}
              onSelectNode={setSelectedLearningNodeIndex}
            />
          </div>
        </aside>

        {/* ── Node content area ────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto mobile-checkpoint-safe-area">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {currentNode !== undefined ? (
              <div className="space-y-6">
                <NodeStageHeader
                  node={currentNode}
                  nodeIndex={currentNodeIndex}
                  totalNodes={lesson.learningPath.length}
                  isRevisit={isCompletedSelection}
                />
                <NodeRenderer
                  node={currentNode}
                  studentState={studentState}
                  quizQuestions={quizQuestions}
                  onAdvance={isCompletedSelection ? () => {} : advanceNode}
                  onSubmitQuizAttempt={isCompletedSelection ? () => {} : submitQuizAttempt}
                  mode={isCompletedSelection ? 'review' : 'learning'}
                />
              </div>
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