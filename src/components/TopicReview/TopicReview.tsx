'use client';

// src/components/TopicReview/TopicReview.tsx
// Post-completion read-only topic review experience.
//
// Tab layout (Feature 1):
// - "Summary" tab  — TopicSummary (What You Learned, Key Concepts, etc.)
// - "Checkpoints" tab — NodeRenderer for the selected learning path node
//
// Default tab: 'summary'.
// When the user clicks a node in the sidebar, auto-switches to 'checkpoints'.
//
// Uses lesson JSON + current StudentState without mutating progress.

import { useState } from 'react';
import { useEngineTranslations } from '@/hooks/useEngineTranslations';
import { LearningPath } from '@/components/LearningPath/LearningPath';
import { NodeRenderer } from '@/components/NodeRenderer/NodeRenderer';
import { ChallengeSolution } from '@/components/TopicReview/ChallengeSolution';
import { Button } from '@/components/ui/Button';
import type { ChallengeNode, Lesson } from '@/types/lesson';
import type { StudentState } from '@/types/state';

interface TopicReviewProps {
  lesson: Lesson;
  studentState: StudentState;
  selectedNodeIndex: number;
  onSelectNode: (index: number) => void;
  onBackToAchievement: () => void;
  onReturn: () => void;
}

type ActiveTab = 'summary' | 'checkpoints';

const noop = () => {};

export function TopicReview({
  lesson,
  studentState,
  selectedNodeIndex,
  onSelectNode,
  onBackToAchievement,
  onReturn,
}: TopicReviewProps) {
  const t = useEngineTranslations();
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');

  const selectedNode = lesson.learningPath[selectedNodeIndex] ?? lesson.learningPath[0];
  const isChallenge = selectedNode?.type === 'challenge';
  const challengeNode = isChallenge ? (selectedNode as ChallengeNode) : null;
  const challengeNodes = lesson.learningPath.filter(
    (node): node is ChallengeNode => node.type === 'challenge'
  );

  // When the user picks a node in the sidebar, switch to the Checkpoints tab
  // so the selected node content is immediately visible.
  function handleSelectNode(index: number) {
    onSelectNode(index);
    setActiveTab('checkpoints');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-primary font-bold text-lg tracking-tight">
              BITS2BYTES
            </span>
            <span className="ml-3 text-text-muted text-sm hidden sm:inline">
              {t('review.title')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={onBackToAchievement} variant="ghost" size="sm">
              {t('review.achievement')}
            </Button>
            <Button onClick={onReturn} variant="secondary" size="sm">
              {t('review.back')}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="lg:w-72 lg:shrink-0 lg:border-r lg:border-white/10 lg:overflow-y-auto lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14">
          <div className="lg:hidden border-b border-white/10">
            <div className="px-4 py-3">
              <LearningPath
                nodes={lesson.learningPath}
                studentState={studentState}
                mode="review"
                selectedNodeIndex={selectedNodeIndex}
                onSelectNode={handleSelectNode}
              />
            </div>
          </div>
          <div className="hidden lg:block h-full">
            <LearningPath
              nodes={lesson.learningPath}
              studentState={studentState}
              mode="review"
              selectedNodeIndex={selectedNodeIndex}
              onSelectNode={handleSelectNode}
            />
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto mobile-checkpoint-safe-area">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">

            {/* ── Tab bar ───────────────────────────────────────────────────
                Two pill buttons. Active tab: solid primary-tinted background.
                Inactive tab: ghost with hover state.                           */}
            <div
              className="flex gap-2 p-1 rounded-2xl bg-card/60 border border-white/10 w-fit"
              role="tablist"
              aria-label="Review sections"
            >
              <TabButton
                id="tab-summary"
                panelId="panel-summary"
                active={activeTab === 'summary'}
                onClick={() => setActiveTab('summary')}
              >
                {t('review.summary')}
              </TabButton>
              <TabButton
                id="tab-checkpoints"
                panelId="panel-checkpoints"
                active={activeTab === 'checkpoints'}
                onClick={() => setActiveTab('checkpoints')}
              >
                {t('review.checkpoints')}
              </TabButton>
            </div>

            {/* ── Summary tab panel ─────────────────────────────────────── */}
            <div
              id="panel-summary"
              role="tabpanel"
              aria-labelledby="tab-summary"
              hidden={activeTab !== 'summary'}
            >
              {activeTab === 'summary' && (
                <TopicSummary
                  lesson={lesson}
                  challengeNodes={challengeNodes}
                  quizQuestions={lesson.quiz.questions}
                />
              )}
            </div>

            {/* ── Checkpoints tab panel ─────────────────────────────────── */}
            <div
              id="panel-checkpoints"
              role="tabpanel"
              aria-labelledby="tab-checkpoints"
              hidden={activeTab !== 'checkpoints'}
            >
              {activeTab === 'checkpoints' && selectedNode !== undefined && (
                <div className="space-y-6">
                  {/* Hint when no node has been explicitly selected yet */}
                  <p className="text-xs text-text-muted">
                    {t('review.selectHint')}
                  </p>

                  <NodeRenderer
                    node={selectedNode}
                    studentState={studentState}
                    quizQuestions={lesson.quiz.questions}
                    onAdvance={noop}
                    onSubmitQuizAttempt={noop}
                    mode="review"
                  />

                  {challengeNode !== null && (
                    <ReviewSection title="Example Solution" defaultOpen={false}>
                      <ChallengeSolution solution={challengeNode.solution} />
                    </ReviewSection>
                  )}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

// ── Tab button ───────────────────────────────────────────────────────────────

function TabButton({
  id,
  panelId,
  active,
  onClick,
  children,
}: {
  id: string;
  panelId: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      onClick={onClick}
      className={[
        'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none',
        active
          ? 'bg-primary text-white shadow-sm shadow-primary/30'
          : 'text-text-muted hover:text-text-base hover:bg-white/5',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ── TopicSummary ─────────────────────────────────────────────────────────────
// Unchanged logic from original — What You Learned, Key Concepts, etc.

function TopicSummary({
  lesson,
  challengeNodes,
  quizQuestions,
}: {
  lesson: Lesson;
  challengeNodes: ChallengeNode[];
  quizQuestions: Lesson['quiz']['questions'];
}) {
  const t = useEngineTranslations();
  const review = lesson.review;

  return (
    <section className="space-y-5" aria-label="Topic summary">
      <div className="space-y-2">
        <p className="text-primary text-sm font-semibold uppercase tracking-[0.18em]">
          {t('review.topicSummary')}
        </p>
        <h1 className="text-3xl font-bold text-text-base leading-tight tracking-tight">
          {lesson.metadata.title}
        </h1>
        <p className="text-text-muted leading-relaxed">
          {t('review.topicComplete')}
        </p>
      </div>

      <ReviewSection title={t('review.whatYouLearned')} defaultOpen>
        <SummaryList items={review?.learned ?? lesson.objectives} tone="success" />
      </ReviewSection>

      <ReviewSection title={t('review.keyConcepts')} defaultOpen={false}>
        <SummaryList items={review?.keyConcepts ?? []} tone="warning" />
      </ReviewSection>

      <ReviewSection title={t('review.takeaways')} defaultOpen={false}>
        <SummaryList items={review?.takeaways ?? []} tone="primary" />
      </ReviewSection>

      {challengeNodes.length > 0 && (
        <ReviewSection title={t('review.challenge')} defaultOpen={false}>
          <div className="space-y-4">
            {challengeNodes.map((challenge) => (
              <div key={challenge.id} className="space-y-2">
                <h2 className="text-base font-semibold text-text-base">{challenge.title}</h2>
                <p className="text-sm leading-relaxed text-text-muted whitespace-pre-wrap">
                  {challenge.instructions}
                </p>
              </div>
            ))}
          </div>
        </ReviewSection>
      )}

      <ReviewSection title={t('review.quizExplanation')} defaultOpen={false}>
        <div className="space-y-4">
          {quizQuestions.map((question, index) => (
            <article
              key={question.id}
              className="rounded-xl border border-white/10 bg-background/40 p-4 space-y-3"
            >
              <h2 className="text-sm font-semibold text-text-base">
                {t('review.question', { n: index + 1 })}
              </h2>
              <p className="text-sm leading-relaxed text-text-base">{question.question}</p>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-success">{t('review.correctAnswer')}</p>
                <p className="text-sm leading-relaxed text-text-base">{question.correctAnswer}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t('review.explanation')}</p>
                <p className="text-sm leading-relaxed text-text-muted">{question.explanation}</p>
              </div>
            </article>
          ))}
        </div>
      </ReviewSection>
    </section>
  );
}

// ── ReviewSection ────────────────────────────────────────────────────────────

function ReviewSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-white/10 bg-card/80 shadow-sm shadow-black/10"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-semibold text-text-base outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span
          className="text-text-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        >
          ⌄
        </span>
      </summary>
      <div className="border-t border-white/10 px-5 py-5 sm:px-6">
        {children}
      </div>
    </details>
  );
}

// ── SummaryList ───────────────────────────────────────────────────────────────

function SummaryList({
  items,
  tone,
}: {
  items: string[];
  tone: 'primary' | 'success' | 'warning';
}) {
  const t = useEngineTranslations();

  const markerClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
  };

  return items.length > 0 ? (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-text-base leading-relaxed">
          <span className={`${markerClasses[tone]} mt-0.5 shrink-0`} aria-hidden="true">
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-text-muted">{t('review.noSummary')}</p>
  );
}
