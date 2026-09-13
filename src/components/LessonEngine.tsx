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
//
// Persistence strategy:
//   - studentId in URL params → HybridAdapter (Supabase primary + localStorage fallback)
//   - no studentId → LocalStorageAdapter (anonymous / standalone mode)

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useEngineState } from '@/hooks/useEngineState';
import { LocalStorageAdapter } from '@/persistence/localStorageAdapter';
import { SupabaseAdapter } from '@/persistence/supabaseAdapter';
import { HybridAdapter } from '@/persistence/hybridAdapter';
import { NodeRenderer } from '@/components/NodeRenderer/NodeRenderer';
import { AchievementScreen } from '@/components/AchievementScreen/AchievementScreen';
import { TopicIntro } from '@/components/TopicIntro/TopicIntro';
import { TopicReview } from '@/components/TopicReview/TopicReview';
import { TopProgressBar } from '@/components/ui/TopProgressBar';
import { ErrorScreen } from '@/components/ui/ErrorScreen';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useLmsPostMessage } from '@/hooks/useLmsPostMessage';
import { useEngineTranslations } from '@/hooks/useEngineTranslations';

interface LessonEngineProps {
  topicId: string;
}

// Module-level fallback adapter (anonymous / no studentId)
const localAdapter = new LocalStorageAdapter();

export function LessonEngine({ topicId }: LessonEngineProps) {
  const t = useEngineTranslations();
  const urlParams = useUrlParams();
  const { sendLessonComplete, sendQuizSubmitted, sendXpUpdate } = useLmsPostMessage(
    topicId,
    urlParams.studentId,
    urlParams.lmsOrigin,
  );
  const [viewMode, setViewMode] = useState<'achievement' | 'review'>('achievement');
  const [selectedReviewNodeIndex, setSelectedReviewNodeIndex] = useState(0);
  const [selectedLearningNodeIndex, setSelectedLearningNodeIndex] = useState<number | null>(null);

  // ── Mimo-style UI state ────────────────────────────────────────────────────
  const [cardKey, setCardKey] = useState(0);
  const [canAdvance, setCanAdvance] = useState(true);
  const [xpPopValue, setXpPopValue] = useState<number | null>(null);

  // Build a stable adapter based on whether a studentId is available.
  // We hold refs so that the adapter instances are not recreated on every render.
  const supabaseAdapterRef = useRef<SupabaseAdapter | null>(null);
  const hybridAdapterRef = useRef<HybridAdapter | null>(null);

  const adapter = useMemo(() => {
    const { studentId, lmsOrigin } = urlParams;
    if (studentId) {
      // Reuse existing instance if studentId hasn't changed
      if (supabaseAdapterRef.current === null) {
        const apiBase = lmsOrigin ?? '';
        supabaseAdapterRef.current = new SupabaseAdapter({ apiBase, studentId });
        hybridAdapterRef.current = new HybridAdapter(supabaseAdapterRef.current, localAdapter);
      }
      return hybridAdapterRef.current!;
    }
    // Anonymous mode — reset Supabase adapter refs
    supabaseAdapterRef.current = null;
    hybridAdapterRef.current = null;
    return localAdapter;
  // urlParams.studentId is the relevant dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlParams.studentId, urlParams.lmsOrigin]);

  // Prefetch persisted state from Supabase before engine loads
  useEffect(() => {
    if (!(adapter instanceof HybridAdapter)) return;
    void adapter.prefetch(topicId);
  }, [adapter, topicId]);

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

  useEffect(() => {
    if (studentState.topicCompleted) return;
    setSelectedLearningNodeIndex(studentState.currentNodeIndex);
  }, [studentState.currentNodeIndex, studentState.topicCompleted]);

  // ── postMessage: topic completed ─────────────────────────────────────────
  useEffect(() => {
    if (!studentState.topicCompleted) return;
    sendLessonComplete(
      studentState.xpEarned,
      studentState.bestQuizScore,
      lesson?.completion.achievementName,
      lesson?.completion.achievementIcon,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentState.topicCompleted]);

  // ── postMessage: quiz attempt submitted ──────────────────────────────────
  useEffect(() => {
    const last = studentState.quizAttempts[studentState.quizAttempts.length - 1];
    if (last === undefined) return;
    sendQuizSubmitted(
      last.score,
      last.attemptNumber,
      studentState.bestQuizScore,
      quizQuestions.length,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentState.quizAttempts.length]);

  // ── postMessage: XP earned ───────────────────────────────────────────────
  useEffect(() => {
    if (studentState.xpEarned === 0) return;
    sendXpUpdate(studentState.xpEarned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentState.xpEarned]);

  // ── Current node (safe to derive before early returns; lesson may be null) ─
  const selectedLearningNode = (lesson !== null && selectedLearningNodeIndex !== null)
    ? lesson.learningPath[selectedLearningNodeIndex]
    : undefined;
  const currentNode = lesson !== null
    ? (selectedLearningNode ?? lesson.learningPath[studentState.currentNodeIndex])
    : undefined;
  const currentNodeIndex = selectedLearningNodeIndex ?? studentState.currentNodeIndex;
  const isCompletedSelection = currentNode !== undefined &&
    currentNodeIndex !== studentState.currentNodeIndex &&
    studentState.completedNodes.includes(currentNode.id);

  // ── Mimo-style advance handler ─────────────────────────────────────────────
  const handleAdvance = useCallback(() => {
    if (selectedLearningNodeIndex !== null && selectedLearningNodeIndex < studentState.currentNodeIndex) {
      setSelectedLearningNodeIndex(selectedLearningNodeIndex + 1);
      setCardKey((k) => k + 1);
      setCanAdvance(true);
      return;
    }

    const xp = currentNode?.xp ?? 0;
    if (xp > 0) setXpPopValue(xp);
    advanceNode();
    setCardKey((k) => k + 1);
    setCanAdvance(true);
  }, [currentNode, advanceNode, selectedLearningNodeIndex, studentState.currentNodeIndex]);

  const handlePrevious = useCallback(() => {
    if (currentNodeIndex === 0) return;
    setSelectedLearningNodeIndex(currentNodeIndex - 1);
    setCardKey((k) => k + 1);
    setCanAdvance(true);
  }, [currentNodeIndex]);

  // ── Load error: hard block ─────────────────────────────────────────────────
  if (loadError !== null) {
    return <ErrorScreen title={t('lesson.couldNotLoad')} message={loadError} />;
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
          <p className="text-text-muted text-sm">{t('lesson.loading')}</p>
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
          onReturn={() => {
            const dashboardPath = '/student/dashboard';
            const dashboardUrl = urlParams.lmsOrigin
              ? `${urlParams.lmsOrigin.replace(/\/$/, '')}${dashboardPath}`
              : dashboardPath;
            window.location.assign(dashboardUrl);
          }}
        />
      );
    }

    return (
      <AchievementScreen
        lesson={lesson}
        studentState={studentState}
        onReview={() => { setViewMode('review'); }}
      />
    );
  }

  // ── Main lesson layout (Mimo/Duolingo style) ───────────────────────────────
  const totalNodes = lesson.learningPath.length;
  const isLastNode = currentNodeIndex === totalNodes - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      {/* ── Top progress bar (replaces old sticky header) ──────────── */}
      <TopProgressBar
        currentStep={currentNodeIndex + 1}
        totalSteps={totalNodes}
        topicTitle={lesson.metadata.title}
        xpPopValue={xpPopValue}
        onXpPopDone={() => setXpPopValue(null)}
      />

      {/* ── Scrollable node content area ───────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-28">
        <div
          key={cardKey}
          className="slide-in-from-right max-w-lg mx-auto w-full px-4 sm:px-6 py-8"
        >
          {currentNode !== undefined ? (
            <NodeRenderer
              node={currentNode}
              studentState={studentState}
              quizQuestions={quizQuestions}
              onAdvance={handleAdvance}
              onSubmitQuizAttempt={isCompletedSelection ? () => {} : submitQuizAttempt}
              onCanAdvanceChange={(v) => setCanAdvance(v)}
              mode={isCompletedSelection ? 'review' : 'learning'}
            />
          ) : (
            <div className="text-center space-y-4 py-20">
              <p className="text-text-muted text-sm">{t('lesson.completing')}</p>
            </div>
          )}
        </div>
      </main>

      {/* ── Sticky bottom CTA bar ───────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-page)]/95 backdrop-blur border-t border-white/10 sticky-cta-safe-area px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-6">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentNodeIndex === 0}
            className="inline-flex min-h-10 w-36 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/15 bg-card px-3 py-2 text-sm font-bold text-text-base transition-all duration-200 hover:border-white/25 hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:w-40"
            aria-label="Kembali ke halaman sebelumnya"
          >
            <ArrowLeft aria-hidden="true" data-icon="inline-start" />
            Kembali
          </button>
          <button
            type="button"
            onClick={handleAdvance}
            disabled={!canAdvance || isCompletedSelection}
            className={[
              'inline-flex min-h-10 w-36 shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all duration-200 sm:w-40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              canAdvance && !isCompletedSelection
                ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98]'
                : 'bg-white/10 text-text-muted cursor-not-allowed',
            ].join(' ')}
            aria-label={isLastNode ? 'Selesai' : 'Selanjutnya'}
          >
            {isLastNode ? 'Selesai' : 'Selanjutnya'}
            {isLastNode ? (
              <Check aria-hidden="true" data-icon="inline-end" />
            ) : (
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
