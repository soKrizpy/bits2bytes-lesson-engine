'use client';

// src/components/QuizEngine/QuizEngine.tsx
// Full quiz experience — state machine: idle → active → reviewing → (idle | complete)
//
// CRITICAL BUSINESS RULES:
// - Max 2 attempts. 3rd attempt HARD BLOCKED.
// - bestQuizScore = MAX(all attempts) — enforced in useEngineState hook.
// - Quiz node marked complete after first submission.
// - After submission, student may proceed to next node via onAdvance.

import { useState } from 'react';
import { QuizQuestionCard } from './QuizQuestion';
import { QuizReview } from './QuizReview';
import { Button } from '@/components/ui/Button';
import type { QuizQuestion } from '@/types/lesson';
import type { StudentState } from '@/types/state';

const MAX_ATTEMPTS = 2;

type QuizPhase = 'idle' | 'active' | 'reviewing';

interface QuizEngineProps {
  questions: QuizQuestion[];
  studentState: StudentState;
  onSubmitAttempt: (answers: Record<string, string>) => void;
  onAdvance: () => void;
}

export function QuizEngine({
  questions,
  studentState,
  onSubmitAttempt,
  onAdvance,
}: QuizEngineProps) {
  const [phase, setPhase] = useState<QuizPhase>('idle');
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, string>>({});

  const attemptsUsed = studentState.quizAttempts.length;
  const canAttempt = attemptsUsed < MAX_ATTEMPTS;
  const lastAttempt =
    studentState.quizAttempts.length > 0
      ? studentState.quizAttempts[studentState.quizAttempts.length - 1] ?? null
      : null;
  const allAnswered = questions.every((q) => currentAnswers[q.id] !== undefined);

  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

  function handleStartQuiz() {
    // Hard guard — should never be reachable if UI is correct, but belt-and-suspenders
    if (!canAttempt) return;
    setCurrentAnswers({});
    setPhase('active');
  }

  function handleSelectAnswer(questionId: string, answer: string) {
    setCurrentAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  function handleSubmit() {
    if (!allAnswered) return;
    // Freeze answers for review display, then submit to hook
    setReviewAnswers(currentAnswers);
    onSubmitAttempt(currentAnswers);
    setPhase('reviewing');
  }

  function handleRetry() {
    // Only reachable if attemptsUsed < MAX_ATTEMPTS
    setCurrentAnswers({});
    setPhase('idle');
  }

  // ── Idle phase ─────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-text-base">Knowledge Check</h2>
          <p className="text-text-muted text-sm">
            {questions.length} questions · {maxScore} points total
          </p>
        </div>

        {/* Attempt status panel */}
        <div className="bg-card border border-white/10 rounded-xl p-5 space-y-4">
          {/* Attempt counter row */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Attempts used</span>
            <span className="text-sm font-semibold text-text-base tabular-nums">
              {attemptsUsed} / {MAX_ATTEMPTS}
            </span>
          </div>

          {/* Attempt dots */}
          <div className="flex gap-2">
            {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
              <div
                key={i}
                className={[
                  'h-2 flex-1 rounded-full transition-all duration-300',
                  i < attemptsUsed ? 'bg-primary' : 'bg-white/10',
                ].join(' ')}
                aria-hidden="true"
              />
            ))}
          </div>

          {/* Score info */}
          <div className="grid grid-cols-2 gap-4 pt-1 border-t border-white/10">
            <div>
              <p className="text-xs text-text-muted">Last score</p>
              <p className="text-lg font-bold text-text-base tabular-nums">
                {lastAttempt !== null ? lastAttempt.score.toString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Best score</p>
              <p className="text-lg font-bold text-xpGold tabular-nums">
                {studentState.bestQuizScore > 0
                  ? studentState.bestQuizScore.toString()
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Action area */}
        {canAttempt ? (
          <div className="space-y-3">
            <Button onClick={handleStartQuiz} size="lg" className="w-full sm:w-auto">
              {attemptsUsed === 0
                ? 'Start Quiz →'
                : `Retry Quiz (Attempt ${attemptsUsed + 1} of ${MAX_ATTEMPTS}) →`}
            </Button>
            {attemptsUsed > 0 && (
              <Button onClick={onAdvance} variant="ghost" size="md">
                Skip and continue
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-card border border-white/10 rounded-xl p-4 text-sm text-text-muted">
              ✅ You have used all {MAX_ATTEMPTS} attempts for this quiz. Your best score of{' '}
              <span className="text-xpGold font-semibold">
                {studentState.bestQuizScore}
              </span>{' '}
              has been saved.
            </div>
            <Button onClick={onAdvance} size="lg" className="w-full sm:w-auto">
              Continue →
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Active phase ───────────────────────────────────────────────────────────
  if (phase === 'active') {
    const answeredCount = Object.keys(currentAnswers).length;

    return (
      <div className="space-y-8">
        {/* Header with attempt info */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-base">Knowledge Check</h2>
          <span className="text-xs font-semibold bg-primary/15 text-primary border border-primary/20 px-3 py-1 rounded-full">
            Attempt {attemptsUsed + 1} of {MAX_ATTEMPTS}
          </span>
        </div>

        {/* Progress through questions */}
        <div className="flex items-center gap-1">
          {questions.map((q) => (
            <div
              key={q.id}
              className={[
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                currentAnswers[q.id] !== undefined ? 'bg-primary' : 'bg-white/10',
              ].join(' ')}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="text-xs text-text-muted -mt-6">
          {answeredCount} of {questions.length} answered
        </p>

        {/* All 5 questions on one screen */}
        <div className="space-y-8">
          {questions.map((question, idx) => (
            <div key={question.id} className="bg-card border border-white/10 rounded-xl p-6">
              <QuizQuestionCard
                question={question}
                questionNumber={idx + 1}
                totalQuestions={questions.length}
                selectedAnswer={
                  currentAnswers[question.id] !== undefined
                    ? (currentAnswers[question.id] as string)
                    : null
                }
                onSelect={(answer) => handleSelectAnswer(question.id, answer)}
                disabled={false}
              />
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 flex-wrap">
          <Button onClick={handleSubmit} size="lg" disabled={!allAnswered}>
            {allAnswered
              ? 'Submit Answers →'
              : `Answer all ${questions.length} questions to submit`}
          </Button>
          {!allAnswered && (
            <span className="text-xs text-text-muted">
              {questions.length - answeredCount} question
              {questions.length - answeredCount !== 1 ? 's' : ''} remaining
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Review phase ───────────────────────────────────────────────────────────
  // At this point phase === 'reviewing'.
  // attemptsUsed reflects the count AFTER the hook has recorded the submission.
  const updatedAttemptsUsed = studentState.quizAttempts.length;
  const canRetry = updatedAttemptsUsed < MAX_ATTEMPTS;
  const latestAttempt =
    studentState.quizAttempts.length > 0
      ? studentState.quizAttempts[studentState.quizAttempts.length - 1] ?? null
      : null;
  const currentAttemptScore = latestAttempt !== null ? latestAttempt.score : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-text-base">Quiz Review</h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-muted">
            Attempt {updatedAttemptsUsed} of {MAX_ATTEMPTS}
          </span>
          <span className="text-xpGold font-semibold">
            Best: {studentState.bestQuizScore} pts
          </span>
        </div>
      </div>

      {/* Review component */}
      <QuizReview
        questions={questions}
        answers={reviewAnswers}
        score={currentAttemptScore}
        maxScore={maxScore}
      />

      {/* Attempt exhausted warning */}
      {!canRetry && (
        <div className="bg-card border border-white/10 rounded-xl p-4 text-sm text-text-muted">
          ✅ You have used all {MAX_ATTEMPTS} quiz attempts. Your best score of{' '}
          <span className="text-xpGold font-semibold">{studentState.bestQuizScore}</span> has been
          saved.
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={onAdvance} size="lg">
          Continue →
        </Button>
        {canRetry && (
          <Button onClick={handleRetry} variant="secondary" size="md">
            Try Again (Attempt {updatedAttemptsUsed + 1} of {MAX_ATTEMPTS})
          </Button>
        )}
      </div>
    </div>
  );
}
