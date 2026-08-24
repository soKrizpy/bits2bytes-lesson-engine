'use client';

// src/components/TopicReview/TopicReview.tsx
// Post-completion read-only topic review experience.
// Uses lesson JSON + current StudentState without mutating progress.

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

const noop = () => {};

export function TopicReview({
  lesson,
  studentState,
  selectedNodeIndex,
  onSelectNode,
  onBackToAchievement,
  onReturn,
}: TopicReviewProps) {
  const selectedNode = lesson.learningPath[selectedNodeIndex] ?? lesson.learningPath[0];
  const isChallenge = selectedNode?.type === 'challenge';
  const challengeNode = isChallenge ? (selectedNode as ChallengeNode) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-primary font-bold text-lg tracking-tight">
              BITS2BYTES
            </span>
            <span className="ml-3 text-text-muted text-sm hidden sm:inline">
              Topic Review
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={onBackToAchievement} variant="ghost" size="sm">
              Achievement
            </Button>
            <Button onClick={onReturn} variant="secondary" size="sm">
              Overview
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row">
        <aside className="lg:w-72 lg:shrink-0 lg:border-r lg:border-white/10 lg:overflow-y-auto lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14">
          <div className="lg:hidden border-b border-white/10">
            <div className="px-4 py-3">
              <LearningPath
                nodes={lesson.learningPath}
                studentState={studentState}
                mode="review"
                selectedNodeIndex={selectedNodeIndex}
                onSelectNode={onSelectNode}
              />
            </div>
          </div>
          <div className="hidden lg:block h-full">
            <LearningPath
              nodes={lesson.learningPath}
              studentState={studentState}
              mode="review"
              selectedNodeIndex={selectedNodeIndex}
              onSelectNode={onSelectNode}
            />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
            <TopicSummary lesson={lesson} />

            {selectedNode !== undefined && (
              <section className="space-y-6" aria-label="Selected node review">
                <div className="border-t border-white/10 pt-8">
                  <NodeRenderer
                    node={selectedNode}
                    studentState={studentState}
                    quizQuestions={lesson.quiz.questions}
                    onAdvance={noop}
                    onSubmitQuizAttempt={noop}
                    mode="review"
                  />
                </div>

                {challengeNode !== null && (
                  <ChallengeSolution solution={challengeNode.solution} />
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function TopicSummary({ lesson }: { lesson: Lesson }) {
  const review = lesson.review;

  return (
    <section className="space-y-6" aria-label="Topic summary">
      <div className="space-y-2">
        <p className="text-primary text-sm font-semibold uppercase tracking-widest">
          Review Topic
        </p>
        <h1 className="text-3xl font-bold text-text-base leading-tight">
          {lesson.metadata.title}
        </h1>
        <p className="text-text-muted leading-relaxed">
          {lesson.metadata.description}
        </p>
      </div>

      <SummaryList title="Objectives" items={lesson.objectives} tone="primary" />
      <SummaryList title="What You Learned" items={review?.learned ?? []} tone="success" />
      <SummaryList title="Key Concepts" items={review?.keyConcepts ?? []} tone="warning" />
      <SummaryList title="Useful Takeaways" items={review?.takeaways ?? []} tone="primary" />
    </section>
  );
}

function SummaryList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'primary' | 'success' | 'warning';
}) {
  if (items.length === 0) return null;

  const toneClasses: Record<typeof tone, string> = {
    primary: 'border-primary/20 bg-primary/10 text-primary',
    success: 'border-success/20 bg-success/10 text-success',
    warning: 'border-warning/20 bg-warning/10 text-warning',
  };

  return (
    <div className="bg-card border border-white/10 rounded-xl p-5">
      <p
        className={[
          'inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-4 border',
          toneClasses[tone],
        ].join(' ')}
      >
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-text-base leading-relaxed">
            <span className="text-primary mt-0.5 shrink-0" aria-hidden="true">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
