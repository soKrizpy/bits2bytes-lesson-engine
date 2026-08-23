'use client';

// src/components/QuizEngine/QuizQuestion.tsx
// Single quiz question card with 4 selectable answer options.
// Does NOT reveal correct answers before submission.
// Accessible: role="radiogroup", aria-checked per option.

import type { QuizQuestion } from '@/types/lesson';

interface QuizQuestionProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  disabled: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export function QuizQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelect,
  disabled,
}: QuizQuestionProps) {
  return (
    <div className="space-y-4">
      {/* Question number */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>

      {/* Question text */}
      <p className="text-text-base text-lg font-semibold leading-snug">
        {question.question}
      </p>

      {/* Answer options */}
      <div
        className="space-y-3"
        role="radiogroup"
        aria-label={question.question}
      >
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === option;
          const letter: string = idx < LETTERS.length ? (LETTERS[idx] as string) : String(idx + 1);

          return (
            <button
              key={option}
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelect(option)}
              className={[
                'w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl border',
                'text-sm font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isSelected
                  ? 'border-primary bg-primary/15 text-text-base ring-1 ring-primary/40'
                  : 'border-white/10 bg-card text-text-base hover:border-primary/40 hover:bg-primary/5',
                disabled ? 'cursor-default' : 'cursor-pointer',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Letter badge */}
              <span
                className={[
                  'w-7 h-7 rounded-lg text-xs font-bold shrink-0 flex items-center justify-center transition-all duration-200',
                  isSelected
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-text-muted border border-white/20',
                ].join(' ')}
                aria-hidden="true"
              >
                {letter}
              </span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
