'use client';

// src/components/QuizEngine/QuizReview.tsx
// Post-submission review: shows correct/incorrect per question with explanations.
// Only reveals answers AFTER submission.

import type { QuizQuestion } from '@/types/lesson';
import { useEngineTranslations } from '@/hooks/useEngineTranslations';

interface QuizReviewProps {
  questions: QuizQuestion[];
  answers: Record<string, string>;
  score: number;
  maxScore: number;
}

export function QuizReview({ questions, answers, score, maxScore }: QuizReviewProps) {
  const t = useEngineTranslations();
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Score summary */}
      <div className="bg-card border border-white/10 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm">{t('quiz.yourScore')}</p>
          <p className="text-text-base text-2xl font-bold tabular-nums">
            {score} <span className="text-text-muted text-base font-normal">/ {maxScore}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-text-muted text-sm">{t('quiz.percentLabel')}</p>
          <p
            className={[
              'text-2xl font-bold tabular-nums',
              percentage >= 80
                ? 'text-success'
                : percentage >= 50
                ? 'text-warning'
                : 'text-error',
            ].join(' ')}
          >
            {percentage}%
          </p>
        </div>
      </div>

      {/* Per-question review */}
      <div className="space-y-4">
        {questions.map((question, idx) => {
          const given = answers[question.id] !== undefined ? answers[question.id] : null;
          const isCorrect = given === question.correctAnswer;

          return (
            <div
              key={question.id}
              className={[
                'rounded-xl border p-5 space-y-3',
                isCorrect
                  ? 'border-success/30 bg-success/5'
                  : 'border-error/30 bg-error/5',
              ].join(' ')}
            >
              {/* Question header */}
              <div className="flex items-start gap-3">
                <span
                  className={[
                    'w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-0.5',
                    isCorrect ? 'bg-success text-white' : 'bg-error text-white',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {isCorrect ? '✓' : '✗'}
                </span>
                <p className="text-text-base text-sm font-semibold leading-snug">
                  {idx + 1}. {question.question}
                </p>
              </div>

              {/* Answers */}
              {!isCorrect && (
                <div className="ml-9 space-y-1.5 text-sm">
                  {given !== null && (
                    <p className="text-error/80">
              {t('quiz.yourAnswer')}{' '}
                      <span className="font-medium line-through">{given}</span>
                    </p>
                  )}
                  <p className="text-success">
                    {t('quiz.correctAnswer')}{' '}
                    <span className="font-semibold">{question.correctAnswer}</span>
                  </p>
                </div>
              )}

              {/* Explanation (always shown for wrong answers) */}
              {!isCorrect && question.explanation !== '' && (
                <div className="ml-9 bg-white/5 rounded-lg px-4 py-3 text-sm text-text-muted leading-relaxed border border-white/5">
                  💡 {question.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
