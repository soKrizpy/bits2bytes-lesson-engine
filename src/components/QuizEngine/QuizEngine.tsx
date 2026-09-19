'use client';

// src/components/QuizEngine/QuizEngine.tsx
// Full quiz experience — state machine: idle → active → summary → reviewing → (idle | complete)
//
// CRITICAL BUSINESS RULES:
// - Max 2 attempts. 3rd attempt HARD BLOCKED.
// - bestQuizScore = MAX(all attempts) — enforced in useEngineState hook.
// - Quiz node marked complete after first submission.
// - After submission, students can retry (up to two attempts) or continue.
//
// ACTIVE PHASE: one question at a time.
// - Each question is answered and submitted individually before advancing.
// - The quiz owns its own Continue button, so the lesson-level sticky CTA is
//   disabled throughout and cannot accidentally skip an available retry.

import { useEffect, useState } from 'react';
import { QuizReview } from './QuizReview';
import { Button } from '@/components/ui/Button';
import type { QuizQuestion } from '@/types/lesson';
import type { StudentState } from '@/types/state';
import { useEngineTranslations } from '@/hooks/useEngineTranslations';

const MAX_ATTEMPTS = 2;

type QuizPhase = 'idle' | 'active' | 'summary' | 'reviewing';

interface QuizEngineProps {
  questions: QuizQuestion[];
  studentState: StudentState;
  onSubmitAttempt: (answers: Record<string, string>) => void;
  onAdvance: () => void;
  onCanAdvanceChange?: (canAdvance: boolean) => void;
}

export function QuizEngine({
  questions,
  studentState,
  onSubmitAttempt,
  onAdvance,
  onCanAdvanceChange,
}: QuizEngineProps) {
  const t = useEngineTranslations();
  const [phase, setPhase] = useState<QuizPhase>('idle');
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, string>>({});

  // Per-question state for active phase
  const [questionIndex, setQuestionIndex] = useState(0);
  const [perQuestionAnswer, setPerQuestionAnswer] = useState<string | null>(null);
  const [perQuestionSubmitted, setPerQuestionSubmitted] = useState(false);
  const [allAnswers, setAllAnswers] = useState<Record<string, string>>({});

  const attemptsUsed = studentState.quizAttempts.length;
  const canAttempt = attemptsUsed < MAX_ATTEMPTS;
  const lastAttempt =
    studentState.quizAttempts.length > 0
      ? studentState.quizAttempts[studentState.quizAttempts.length - 1] ?? null
      : null;

  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

  // Signal external StickyCtaBar about advance availability
  useEffect(() => {
    onCanAdvanceChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handleStartQuiz() {
    if (!canAttempt) return;
    setQuestionIndex(0);
    setPerQuestionAnswer(null);
    setPerQuestionSubmitted(false);
    setAllAnswers({});
    setPhase('active');
  }

  function handleSelectAnswer(answer: string) {
    if (perQuestionSubmitted) return;
    setPerQuestionAnswer(answer);
  }

  function handleSubmitAnswer() {
    if (perQuestionAnswer === null || perQuestionSubmitted) return;
    setPerQuestionSubmitted(true);
  }

  function handleNextQuestion() {
    if (!perQuestionSubmitted || perQuestionAnswer === null) return;

    const question = questions[questionIndex];
    if (question === undefined) return;

    const newAllAnswers = { ...allAnswers, [question.id]: perQuestionAnswer };
    setAllAnswers(newAllAnswers);

    const isLast = questionIndex === questions.length - 1;

    if (!isLast) {
      setQuestionIndex(questionIndex + 1);
      setPerQuestionAnswer(null);
      setPerQuestionSubmitted(false);
    } else {
      // All questions answered — submit and go to summary
      setReviewAnswers(newAllAnswers);
      onSubmitAttempt(newAllAnswers);
      setPhase('summary');
    }
  }

  function handleRetry() {
    setQuestionIndex(0);
    setPerQuestionAnswer(null);
    setPerQuestionSubmitted(false);
    setAllAnswers({});
    // Start the next permitted attempt immediately. Returning to idle made a
    // student tap "retry" twice and left the global Continue CTA enabled.
    setPhase('active');
  }

  // ── Idle phase ─────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-text-base">{t('quiz.title')}</h2>
          <p className="text-text-muted text-sm">
            {t('quiz.questions', { count: questions.length, points: maxScore })}
          </p>
        </div>

        {/* Attempt status panel */}
        <div className="bg-card border border-white/10 rounded-xl p-5 space-y-4">
          {/* Attempt counter row */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">{t('quiz.attemptsUsed')}</span>
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
              <p className="text-xs text-text-muted">{t('quiz.lastScore')}</p>
              <p className="text-lg font-bold text-text-base tabular-nums">
                {lastAttempt !== null ? lastAttempt.score.toString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">{t('quiz.bestScore')}</p>
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
                ? t('quiz.startQuiz')
                : t('quiz.retryQuiz', { n: attemptsUsed + 1, max: MAX_ATTEMPTS })}
            </Button>
            {attemptsUsed > 0 && (
              <Button onClick={onAdvance} variant="ghost" size="md">
                {t('quiz.skipAndContinue')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-card border border-white/10 rounded-xl p-4 text-sm text-text-muted">
              {t('quiz.allAttemptsUsed', { max: MAX_ATTEMPTS, score: studentState.bestQuizScore })}
            </div>
            <Button onClick={onAdvance} size="lg" className="w-full sm:w-auto">
              {t('quiz.continue')}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Active phase ───────────────────────────────────────────────────────────
  if (phase === 'active') {
    const question = questions[questionIndex];
    if (question === undefined) return null;

    const isLast = questionIndex === questions.length - 1;

    return (
      <div className="space-y-6">
        {/* Header with attempt badge */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-base">{t('quiz.title')}</h2>
          <span className="text-xs font-semibold bg-primary/15 text-primary border border-primary/20 px-3 py-1 rounded-full">
            {t('quiz.attempt', { n: attemptsUsed + 1, max: MAX_ATTEMPTS })}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className={[
                'h-1.5 flex-1 rounded-full transition-all duration-300',
                i < questionIndex
                  ? 'bg-primary'
                  : i === questionIndex
                  ? 'bg-primary/50'
                  : 'bg-white/10',
              ].join(' ')}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="text-xs text-text-muted -mt-4">
          {t('quiz.answered', { answered: questionIndex, total: questions.length })}
        </p>

        {/* Question card */}
        <div className="bg-card border border-white/10 rounded-xl p-6 space-y-5">
          {/* Question text */}
          <p className="text-lg font-bold text-text-base leading-snug">
            {questionIndex + 1}. {question.question}
          </p>

          {/* Answer options */}
          <div className="space-y-3">
            {question.options.map((option) => {
              const isSelected = perQuestionAnswer === option;
              const isCorrect = option === question.correctAnswer;

              let optionClass =
                'w-full min-h-[3.5rem] px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

              if (!perQuestionSubmitted) {
                // Pre-submission styling
                optionClass += isSelected
                  ? ' border-primary bg-primary/10 text-primary'
                  : ' border-white/10 bg-white/5 text-text-base hover:border-white/30 hover:bg-white/10';
              } else {
                // Post-submission styling
                if (isCorrect) {
                  optionClass += ' border-success bg-success/10 text-success';
                } else if (isSelected && !isCorrect) {
                  optionClass += ' border-error bg-error/10 text-error';
                } else {
                  optionClass += ' border-white/10 bg-white/5 text-text-muted opacity-50';
                }
              }

              return (
                <button
                  key={option}
                  className={optionClass}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={perQuestionSubmitted}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Explanation callout (shown after submission) */}
          {perQuestionSubmitted && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-text-muted leading-relaxed">
              <span className="font-semibold text-text-base block mb-1">
                {perQuestionAnswer === question.correctAnswer ? '🎉 Correct!' : '🤔 Not quite.'}
              </span>
              {question.explanation}
            </div>
          )}
        </div>

        {/* Submit / Next button */}
        {!perQuestionSubmitted ? (
          <Button
            onClick={handleSubmitAnswer}
            size="lg"
            className="w-full"
            disabled={perQuestionAnswer === null}
          >
            {t('quiz.submitAnswers')}
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            size="lg"
            className="w-full"
          >
            {isLast ? t('quiz.continue') : t('quiz.next')}
          </Button>
        )}
      </div>
    );
  }

  // ── Summary phase ──────────────────────────────────────────────────────────
  if (phase === 'summary') {
    // attemptsUsed reflects post-submission count from studentState
    const updatedAttemptsUsed = studentState.quizAttempts.length;
    const latestAttempt =
      studentState.quizAttempts.length > 0
        ? studentState.quizAttempts[studentState.quizAttempts.length - 1] ?? null
        : null;
    const latestScore = latestAttempt !== null ? latestAttempt.score : 0;

    const correctCount = questions.filter(
      (q) => reviewAnswers[q.id] === q.correctAnswer
    ).length;

    const canRetry = updatedAttemptsUsed < MAX_ATTEMPTS;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-text-base">{t('quiz.title')}</h2>
        </div>

        {/* Summary card */}
        <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4 text-center">
          <p className="text-4xl font-bold text-xpGold tabular-nums">
            {t('quiz.summaryScore', { score: latestScore, max: maxScore })}
          </p>
          <p className="text-text-muted text-sm">
            {t('quiz.summaryCorrect', { correct: correctCount, total: questions.length })}
          </p>
        </div>

        {/* Attempt exhausted warning */}
        {!canRetry && (
          <div className="bg-card border border-white/10 rounded-xl p-4 text-sm text-text-muted">
            {t('quiz.allAttemptsUsed', { max: MAX_ATTEMPTS, score: studentState.bestQuizScore })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={onAdvance} size="lg" className="w-full">
            {t('quiz.next')}
          </Button>
          {canRetry && (
            <Button onClick={handleRetry} variant="secondary" size="md" className="w-full">
              {t('quiz.tryAgain', { n: updatedAttemptsUsed + 1, max: MAX_ATTEMPTS })}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Reviewing phase ────────────────────────────────────────────────────────
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
            {t('quiz.attempt', { n: updatedAttemptsUsed, max: MAX_ATTEMPTS })}
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
          {t('quiz.allAttemptsUsed', { max: MAX_ATTEMPTS, score: studentState.bestQuizScore })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={onAdvance} size="lg">
          {t('quiz.continue')}
        </Button>
        {canRetry && (
          <Button onClick={handleRetry} variant="secondary" size="md">
            {t('quiz.tryAgain', { n: updatedAttemptsUsed + 1, max: MAX_ATTEMPTS })}
          </Button>
        )}
      </div>
    </div>
  );
}
